const fs = require("fs");

module.exports = function (path, emulator, data) {

  // let unique = [...new Set(data)];
  // unique.sort();

  if (fs.existsSync(`${path}/${emulator}-roms-to-copy.json`)) {
    console.log('Delete old dump file');
    fs.unlinkSync(`${path}/${emulator}-roms-to-copy.json`);
  }
  console.log('Saving file...');
  fs.appendFile(`${path}/${emulator}-roms-to-copy.json`, JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('File Saved!');
  });
};