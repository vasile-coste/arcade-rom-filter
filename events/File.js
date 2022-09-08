const fs = require("fs");

function createFile (path, emulator, data) {
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


function getFilesize (filename) {
  const stats = fs.statSync(filename);
  const fileSizeInMegabytes = stats.size / (1024 * 1024)
  return fileSizeInMegabytes + 'MB';
}

module.exports = { createFile, getFilesize };