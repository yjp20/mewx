const yup = require("yup");
const { v4: uuid } = require("uuid");

const userSchema = yup.object().shape({
  id: yup.string(),
  name: yup.string().min(3).max(20),
  desc: yup.string().max(140),
  created_at: yup.date(),
  updated_at: yup.date(),
});

async function register(db) {
  const exists = await db.schema.hasTable("users");
  if (!exists) {
    await db.schema.createTable("users", (table) => {
      table.uuid("id").unique().primary().notNullable();
      table.string("name").unique().notNullable();
      table.string("desc");
      table.timestamps();
    });
  }

  return {
    create: async (name, desc) => {
      const user = {
        id: uuid(),
        name: name,
        desc: desc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await userSchema.isValid(user);
      await db("users").insert(user);
      return user;
    },
    getById: async (id) => {
      const user = await db("users").where("id", id).first();
      return user;
    },
    getAll: () => {},
  };
}

module.exports = { register };
