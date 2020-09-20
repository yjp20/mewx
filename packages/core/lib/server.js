const Koa = require("koa");
const Router = require("koa-router");
const compress = require("koa-compress");
const helmet = require("koa-helmet");
const bodyParser = require("koa-bodyparser");
const client = require("mewx-client");
const mewxModuleAuth = require("mewx-module-auth");
require("sqlite3");

const api = require("./api");
const schema = require("./schema");

const defaultOptions = {
  name: "mewx",
  desc: "Easily bootstrap an online multiplayer game with mewx.",
  modules: [mewxModuleAuth],
  components: {
    home: ["home-meta"],
    auth: [],
  },
  js: [],
  css: [],
  db: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: ":memory:",
  },
};

async function listen(options) {
  const server = await newServer(options);
  server.listen(options.port);
}

async function newServer(options) {
  options = { ...defaultOptions, ...options };

  const app = new Koa();
  const router = new Router();
  const db = require("knex")(options.db);

  const moduleSchemas = [];
  const moduleFiles = {};
  options.modules.forEach((m) => {
    if (m.schema) moduleSchemas.push(...m.schemas);
    if (m.files) Object.assign(moduleFiles, m.files);
    if (m.js) options.js.push(...m.js);
    if (m.css) options.css.push(...m.css);
    if (m.routes) m.routes(router);
    if (m.components) {
      Object.keys(m.components).forEach((key) => {
        options.components[key].push(...m.components[key]);
      });
    }
  });

  const registeredModels = await schema.registerAll(db);
  for ([name, model] of Object.entries(moduleSchemas)) {
    registeredModels[name] = model.register(db);
  }

  // Middleware

  app
    .use(helmet())
    .use(compress())
    .use(bodyParser())
    .use(async function (ctx, next) {
      ctx.state.models = registeredModels;
      return next();
    })
    .use(async function (ctx, next) {
      const token = ctx.get("Authorization");
      if (token) {
        const userToken = await ctx.state.models.userToken.getByToken(token);
        if (!userToken) {
          ctx.body = { error: "Invalid token" };
          ctx.status = 401;
          return;
        }

        const user = await ctx.state.models.user.getById(userToken.user_id);
        if (!user) {
          ctx.body = { error: "Token has no corresponding user" };
          ctx.status = 500;
          return;
        }

        ctx.state.user = user;
        ctx.state.userToken = userToken;
      }
      return next();
    });

  options.modules.forEach((m) => {
    if (m.middleware) app.use(m.middleware);
  });

  // Routes

  app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(client.routes(moduleFiles));

  router
    .post("/api/auth/token", api.authToken)
    .get("/api/users", api.usersList)
    .post("/api/users", api.usersCreate)
    .get("/api/users/:userId", api.usersGet)
    .post("/api/users/:userId", api.usersUpdate)
    .get("/api/rooms", api.roomsList)
    .post("/api/rooms", api.roomsCreate)
    .get("/api/rooms:options", api.roomsOptions)
    .get("/api/rooms/:roomId", api.roomsGet)
    .post("/api/rooms/:roomId", api.roomsUpdate)
    .post("/api/rooms/:roomId:join", api.roomsJoin)
    .get("/options", (ctx) => {
      const safeOptions = Object.keys(options)
        .filter((key) => {
          return !(key in ["db"]);
        })
        .reduce((obj, key) => {
          obj[key] = options[key];
          return obj;
        }, {});

      ctx.body = safeOptions;
    });

  return app;
}

module.exports = {
  listen,
  newServer,
};
