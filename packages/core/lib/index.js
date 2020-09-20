const server = require("./server");
const game= require("./game");

module.exports = {
	listen: server.listen,
	newServer: server.newServer,
	newGame: game.newGame,
}
