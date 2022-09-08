const fs = require("fs");

module.exports = function (emulator, path, webSocket) {
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: '-----------------------------------------------'
    })
  );

  // set files / folders
  const file = `${path}/${emulator}-roms-to-copy.json`;
  const romFolder = `${path}/roms`;
  const destionationFolder = `${path}/roms_filtered`;

  // check if json file was generated
  if (!fs.existsSync(file)) {
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `File ${file} was not found. Please re-run the filter or contact dev if this reappears.`
      })
    );

    return false;
  }

  // check if rom folder exists
  if (!fs.existsSync(romFolder)) {
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Folder '${romFolder}' was not found. Please make sure you have your rom folder inside the folder where you run this program.`
      })
    );

    return false;
  }

  // delete folder and its contents if exists
  if (fs.existsSync(destionationFolder)) {
    fs.rmSync(destionationFolder, { recursive: true, force: true });
  }

  // create a folder for destination roms
  fs.mkdirSync(destionationFolder);

  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Preparing to copy ${emulator} roms...`
    })
  );

  copyRoms(file, romFolder, destionationFolder);


  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Finished!`
    })
  );

  webSocket.send(
    JSON.stringify({
      event: 'finish',
      message: null
    })
  );

};

function copyRoms (file, romFolder, destionationFolder) {
  const jsonObj = JSON.parse(fs.readFileSync(file, 'utf8'));

  jsonObj.forEach(element => {
    if (fs.existsSync(`${romFolder}/${element.rom}`)) {
      console.log(`Copy '${rom.name}' from ${romFolder}/${element.rom} to ${destionationFolder}/${element.rom} ...`);
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Copy '${rom.name}' from ${romFolder}/${element.rom} to ${destionationFolder}/${element.rom} ...`
        })
      );
      try {
        fs.copyFileSync(`${romFolder}/${element.rom}`, `${destionationFolder}/${element.rom}`);

        webSocket.send(
          JSON.stringify({
            event: 'log',
            newLine: false,
            message: 'Done'
          })
        );
      } catch (error) {
        console.log(error);

        webSocket.send(
          JSON.stringify({
            event: 'log',
            newLine: true,
            message: error
          })
        );
      }
    } else {
      console.log(`Rom '${rom.name}' was not found in ${romFolder}/${element.rom}, will skip`);

      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Rom '${rom.name}' was not found in ${romFolder}/${element.rom}, will skip`
        })
      );
    }
  });
}