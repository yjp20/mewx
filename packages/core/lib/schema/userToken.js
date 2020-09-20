const yup = require("yup");
const { v4: uuid } = require("uuid");

const userTokenSchema = yup.object().shape({
  token: yup.string(),
  user_id: yup.string(),
  created_at: yup.date(),
  updated_at: yup.date(),
});

async function register(db) {
  const exists = await db.schema.hasTable("userTokens");
  if (!exists) {
    await db.schema.createTable("userTokens", (table) => {
      table.string("token").primary().notNullable();
      table.string("user_id").unique().notNullable();
      table.timestamps();
    });
  }

  return {
    create: async (userId) => {
      const userToken = {
        token: uuid(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await userTokenSchema.isValid(userToken);
      await db("userTokens").insert(userToken);
      return userToken;
    },
    getByToken: async (token) => {
      const userToken = await db("userTokens").where("token", token).first();
      return userToken;
    },
  };
}

module.exports = { register };
