const fs = require("fs");

module.exports = function (emulator, path) {
  const missingFiles = [];
  // check for xml
  if (!fs.existsSync(`${path}/${emulator}.xml`) && !fs.existsSync(`${path}/${emulator}.dat`)) {
    missingFiles.push(`Can't find ${path}/${emulator}.dat or ${path}/${emulator}.xml`);
  }

  if (emulator == 'mame') {
    // check for ini
    if (!fs.existsSync(`${path}/${emulator}.ini`)) {
      missingFiles.push(`Can't find ${path}/${emulator}.ini`);
    }
  }


  return missingFiles;
};
