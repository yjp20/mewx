async function roomsList(ctx) {
  try {
    const rooms = await ctx.state.models.room.getAll()
    ctx.status = 200
    ctx.body = {
      data: {
        rooms: rooms,
      },
    }
  } catch (e) {
    ctx.status = 400
    ctx.body = { error: "Database error: " + e }
  }
}

async function roomsCreate(ctx) {
  const user = ctx.state.user

  if (!user) {
    ctx.status = 401
    ctx.body = { error: "Authentication required" }
    return
  }

  try {
    const room = await ctx.state.models.room.create(
      `${user.name}'s room`,
      user.id
    )
    ctx.status = 200
    ctx.body = {
      data: {
        room: room,
      },
    }
  } catch (e) {
    ctx.status = 500
    ctx.body = { error: "Database error: " + e }
  }
}

async function roomsUpdate(ctx) {}

async function roomsOptions(ctx) {}

async function roomsGet(ctx) {
  const id = ctx.params.roomId

  try {
    const room = await ctx.state.models.room.getById(id)

    if (!room) {
      ctx.status = 404
      ctx.body = {
        error: "Room not found with id: " + id,
      }
    }

    ctx.status = 200
    ctx.body = {
      data: {
        room: room,
      },
    }
  } catch (e) {
    ctx.status = 500
    ctx.body = { error: "Database error: " + e }
  }
}

async function roomsJoin(ctx) {}

module.exports = {
  roomsList,
  roomsCreate,
  roomsUpdate,
  roomsOptions,
  roomsGet,
  roomsJoin,
}
