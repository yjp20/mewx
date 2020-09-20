const tic = require("./tic");
const mewx = require("mewx");

mewx.listen({
	games: tic,
	port: 3000,
});
