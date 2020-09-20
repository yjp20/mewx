const rooms = require("./rooms");
const users = require("./users");

module.exports = {
	...rooms,
	...users,
}
