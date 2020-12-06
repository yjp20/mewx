const yup = require("yup");
const { v4: uuid } = require("uuid");

const roomSchema = yup.object().shape({
  id: yup.string(),
  name: yup.string().min(3).max(20),
  host: yup.string(),
  mode: yup.string(),
  status: yup.string(),
  params: yup.string(),
  player_max: yup.number(),
  created_at: yup.date(),
  updated_at: yup.date(),
});

async function register(db) {
  const exists = await db.schema.hasTable("rooms");
  if (!exists) {
    await db.schema.createTable("rooms", (table) => {
      table.uuid("id").unique().primary().notNullable();
      table.string("name").notNullable();
      table.string("mode");
      table.string("status");
      table.string("host").references("user.id").notNullable();
      table.string("params");
      table.int("player_max");
      table.timestamps();
    });
  }

  return {
    create: async (name, host) => {
      const room = {
        id: uuid(),
        name: name,
        host: host,
        mode: "",
        status: "Waiting",
        player_max: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const valid = await roomSchema.isValid(room);
      if (!valid) {
        throw new Error("Schema Error: Room object doesn't match schema");
      }
      await db("rooms").insert(room);
      await db("roomUsers").insert({
        room_id: room.id,
        user_id: host,
      });
      await db("roomUsers").insert({
        room_id: room.id,
        user_id: "nani",
      });
      return room;
    },
    getById: async (id) => {
      const room = await db("rooms").where("id", id).first();
      return room;
    },
    getAll: async () => {
      const rooms = await db("rooms")
        .join("users", "rooms.host", "=", "users.id")
        .leftJoin("roomUsers", "roomUsers.room_id", "=", "rooms.id")
        .select("rooms.*")
        .count({ player_num: "rooms.id" })
        .select("users.name as host_name")
        .groupBy("rooms.id");
      return rooms;
    },
  };
}

module.exports = { register };
