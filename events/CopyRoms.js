const fs = require("fs");
const path = require('path');

module.exports = function (emulator, webSocket) {
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: '-----------------------------------------------'
    })
  );

  console.log(`Preparing to copy ${emulator} roms...`);
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Preparing to copy ${emulator} roms...`
    })
  );

  // set files / folders
  const dir = path.resolve('./');
  const file = `${dir}/${emulator}-roms-to-copy.json`;
  const romFolder = `${dir}/roms`;
  const destionationFolder = `${dir}/${emulator}_filtered`;

  // check if json file was generated
  if (!fs.existsSync(file)) {
    console.log(`File ${file} was not found. Please re-run the filter or contact dev if this reappears.`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `File ${file} was not found. Please re-run the filter or contact dev if this reappears.`
      })
    );

    // send completed signal
    sendCompletedSignal(webSocket);

    return false;
  }

  // check if rom folder exists
  if (!fs.existsSync(romFolder)) {
    console.log(`Folder '${romFolder}' was not found. Please make sure you have your rom folder inside the folder where you run this program. The folder must be called "roms"`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Folder '${romFolder}' was not found. Please make sure you have your rom folder inside the folder where you run this program. The folder must be called "roms"`
      })
    );

    // send completed signal
    sendCompletedSignal(webSocket);

    return false;
  }

  // delete folder and its contents if exists
  if (fs.existsSync(destionationFolder)) {
    fs.rmSync(destionationFolder, { recursive: true, force: true });
  }

  // create a folder for destination roms
  fs.mkdirSync(destionationFolder);

  copyRoms(file, romFolder, destionationFolder, webSocket);

  console.log(`Finished!`);
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Finished!`
    })
  );

  // send completed signal
  sendCompletedSignal(webSocket);
};

function copyRoms (file, romFolder, destionationFolder, webSocket) {
  const jsonObj = JSON.parse(fs.readFileSync(file, 'utf8'));

  jsonObj.forEach(element => {
    if (fs.existsSync(`${romFolder}/${element.rom}`)) {
      console.log(`Copy '${element.name}' from ${romFolder}/${element.rom} to ${destionationFolder}/${element.rom} ...`);
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Copy '${element.name}' from ${romFolder}/${element.rom} to ${destionationFolder}/${element.rom} ...`
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
      console.log(`Rom '${element.name}' was not found in ${romFolder}/${element.rom}, will skip`);

      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Rom '${element.name}' was not found in ${romFolder}/${element.rom}, will skip`
        })
      );
    }
  });
}


function sendCompletedSignal (webSocket) {
  webSocket.send(
    JSON.stringify({
      event: 'finish',
      message: null
    })
  );
}