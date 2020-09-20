const room = require("./room");
const roomUser = require("./roomUser");
const user = require("./user");
const userToken = require("./userToken");

async function registerAll(db) {
  const models = {
    room: await room.register(db),
    roomUser: await roomUser.register(db),
    user: await user.register(db),
    userToken: await userToken.register(db),
  };
  return models;
}

module.exports = {
  registerAll,
};
