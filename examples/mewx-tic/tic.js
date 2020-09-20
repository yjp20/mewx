const mewx = require("mewx");

const tic = mewx.newGame({
  name: "tic tac toe",
  desc: `Ancient game of logic where the best play from both players results in a draw`,
  newState: () => ({
    board: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    turn: 0,
  }),
  events: {
    start: (data, state) => {},
    move: (data, state, player, end) => {},
    end: (data, state) => {},
  },
});

exports.module = tic;
