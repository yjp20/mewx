const Koa = require("koa");
const Router = require("koa-router");
const fs = require("fs");
const path = require("path");

function read(name) {
  return fs.readFileSync(path.resolve(__dirname, "./src", name), "utf-8");
}

const defaultFiles = {
  "index.html": read("index.html"),
  "client.js": read("client.js"),
  "client.css": read("client.css"),
};

const type = {
  ".js": "application/javascript",
  ".css": "text/css",
};

function routes(files) {
  files = { ...defaultFiles, ...files };

  const router = new Router();

  router.get("/client/:fileName", (ctx, next) => {
    const { fileName } = ctx.params;
    const extension = path.extname(fileName);
    if (fileName in files) {
      ctx.body = files[fileName];
      ctx.set("Content-Type", type[extension]);
    }
    next();
  });

  const middleware = router.routes();

  return async (ctx) => {
    await middleware(ctx, async () => {
      if (ctx.response.status === 404) {
        ctx.body = files["index.html"];
      }
    });
  };
}

module.exports = { routes };
