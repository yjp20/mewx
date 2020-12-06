const Koa = require("koa")
const Router = require("koa-router")
const compress = require("koa-compress")
const helmet = require("koa-helmet")
const bodyParser = require("koa-bodyparser")

const api = require("./api")
const schema = require("./schema")

const defaultOptions = {
  name: "mewx",
  desc: "Easily bootstrap an online multiplayer game with mewx.",
  db: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: ":memory:",
  },
}

async function listen(options) {
  const server = await newServer(options)
  server.listen(options.port)
}

async function newServer(options) {
  options = { ...defaultOptions, ...options }

  const app = new Koa()
  const router = new Router()
  const db = require("knex")(options.db)

  const moduleSchemas = []
  options.modules.forEach((m) => {
    if (m.schema) moduleSchemas.push(...m.schemas)
    if (m.routes) m.routes(router)
  })

  const registeredModels = await schema.registerAll(db)
  for ([name, model] of Object.entries(moduleSchemas)) {
    registeredModels[name] = model.register(db)
  }

  app
    .use(helmet())
    .use(compress())
    .use(bodyParser())
    .use(async function (ctx, next) {
      ctx.state.models = registeredModels
      return next()
    })
    .use(async function (ctx, next) {
      const token = ctx.get("Authorization")
      if (token) {
        const userToken = await ctx.state.models.userToken.getByToken(token)
        if (!userToken) {
          ctx.body = { error: "Invalid token" }
          ctx.status = 401
          return
        }

        const user = await ctx.state.models.user.getById(userToken.user_id)
        if (!user) {
          ctx.body = { error: "Token has no corresponding user" }
          ctx.status = 500
          return
        }

        ctx.state.user = user
        ctx.state.userToken = userToken
      }
      return next()
    })

  options.modules.forEach((m) => {
    if (m.middleware) app.use(m.middleware)
  })

  // Routes

  app
    .use(router.routes())
    .use(router.allowedMethods())

  router
    .post("/auth/token", api.authToken)
    .get("/users", api.usersList)
    .post("/users", api.usersCreate)
    .get("/users/:userId", api.usersGet)
    .post("/users/:userId", api.usersUpdate)
    .get("/rooms", api.roomsList)
    .post("/rooms", api.roomsCreate)
    .get("/rooms:options", api.roomsOptions)
    .get("/rooms/:roomId", api.roomsGet)
    .post("/rooms/:roomId", api.roomsUpdate)
    .post("/rooms/:roomId:join", api.roomsJoin)
    .get("/options", (ctx) => {
      const safeOptions = Object.keys(options)
        .filter((key) => {
          return !(key in ["db"])
        })
        .reduce((obj, key) => {
          obj[key] = options[key]
          return obj
        }, {})

      ctx.body = safeOptions
    })

  return app
}

module.exports = {
  listen,
  newServer,
}
