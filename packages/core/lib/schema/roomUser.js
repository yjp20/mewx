const yup = require("yup");

const roomUserSchema = yup.object().shape({
  user_id: yup.string(),
  room_id: yup.string(),
});

async function register(db) {
  const exists = await db.schema.hasTable("roomUsers");
  if (!exists) {
    await db.schema.createTable("roomUsers", (table) => {
      table.string("user_id").notNullable();
      table.string("room_id").notNullable();
    });
  }

  return {
    create: async (userId, roomId) => {
      const roomUser = {
        user_id: userId,
        room_id: roomId,
      };
      await roomUserSchema.isValid(roomUser);
      await db("roomUsers").insert(roomUser);
      return roomUser;
    },
  };
}

module.exports = { register };
