const fs = require("fs");
const path = require('path');

module.exports = function (emulator) {
  const dir = path.resolve('./');
  const file = `${dir}/${emulator}-roms-to-copy.json`;

  return fs.existsSync(file);
};
