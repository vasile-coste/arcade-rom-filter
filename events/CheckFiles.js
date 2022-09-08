const fs = require("fs");
const path = require('path');

module.exports = function (emulator) {
  const dir = path.resolve('./');

  const missingFiles = [];
  // check for xml
  if (!fs.existsSync(`${dir}/${emulator}.xml`) && !fs.existsSync(`${dir}/${emulator}.dat`)) {
    missingFiles.push(`Can't find ${dir}/${emulator}.dat or ${dir}/${emulator}.xml`);
  }

  if (emulator == 'mame') {
    // check for ini
    if (!fs.existsSync(`${dir}/${emulator}.ini`)) {
      missingFiles.push(`Can't find ${dir}/${emulator}.ini`);
    }
  }


  return missingFiles;
};
