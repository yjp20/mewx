async function authToken(ctx) {
  const user = ctx.state.user
  const userToken = ctx.state.userToken

  ctx.status = 200
  ctx.body = {
    data: {
      user: user,
      token: userToken.token,
    },
  }
}

function usersList(ctx) {}

async function usersCreate(ctx) {
  const { name, desc } = ctx.request.body
  ctx.state.models.users.create(name, desc)
}

function usersGet(ctx) {}

function usersUpdate(ctx) {}

module.exports = {
  authToken,
  usersList,
  usersCreate,
  usersGet,
  usersUpdate,
}
