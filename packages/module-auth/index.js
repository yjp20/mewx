const fs = require("fs");
const path = require("path");
const KoaRouter = require("koa-router");

module.exports = {
  name: "mewx-module-auth",
  js: ["client.auth-guest.js"],
  components: {
    auth: ["auth-guest"],
  },
  files: {
    "client.auth-guest.js": fs.readFileSync(
      path.resolve(__dirname, "client.auth-guest.js")
    ),
  },
  routes: function (router) {
    router.post("/api/auth/guest", async (ctx) => {
      const { name } = ctx.request.body;
      try {
        const user = await ctx.state.models.user.create(name, "");
        const userToken = await ctx.state.models.userToken.create(user.id);
        ctx.status = 200;
        ctx.body = {
          data: {
            user: user,
            token: userToken.token,
          },
        };
      } catch (e) {
        ctx.status = 400;
        if (e.code == "SQLITE_CONSTRAINT") {
          ctx.body = { error: "Username has been used" };
        } else {
          ctx.body = { error: "Database error" };
        }
      }
    });
  },
};
