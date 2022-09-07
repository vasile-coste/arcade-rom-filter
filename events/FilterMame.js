const fs = require("fs");
const convert = require('xml-js');
const CreateFile = require('./CreateFile.js');

module.exports = function (data, path, webSocket) {

  const romsWithCategory = getRomCategoriesFromIniAndFilter(
    webSocket,
    data.emulator,
    path,
    data.categories.map(string => string.toLowerCase()),
    data.subCategories.map(string => string.toLowerCase())
  );
  const romsFromXML = getRomDataFromXMLAndFilter(
    webSocket,
    data.emulator,
    path,
    romsWithCategory,
    data.gameSettings,
    data.extraSettings.map(string => string.toLowerCase()),
    data.extraFilters.map(string => string.toLowerCase())
  );
  const finalRoms = excludeRomsRegions(webSocket, romsFromXML, data.excludeRegions);

  // create a file
  CreateFile(path, data.emulator, finalRoms);

  webSocket.send(
    JSON.stringify({
      event: 'next',
      message: 'next step'
    })
  );
};

function getRomCategoriesFromIniAndFilter (webSocket, emulator, path, categories, subCategories) {
  const file = `${path}/${emulator}.ini`;
  const roms = [];
  let data = null;

  console.log(`Filtering and mapping 'Categories' and 'Sub Categories' from file ${file} ...`);
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Filtering and mapping 'Categories' and 'Sub Categories' from file ${file} ...`
    })
  );

  try {
    data = fs.readFileSync(file, 'utf8');
  } catch (err) {
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: JSON.stringify(err)
      })
    );

    console.error(err);
  }

  if (!data) {
    return roms;
  }

  const rows = data.split("\n");
  rows.forEach(row => {
    if (row != "") {
      // extract rom and full category
      const rowData = String(row).trim().split('=')
      if (rowData.length == 2) {
        // extract main category
        const cat = rowData[1].split(' / ');
        const category = cat[0].trim();
        // check if user approved the main category

        if (categories.includes(category.toLowerCase())) {
          cat.shift();
          // extract sub category
          const subCategory = cat.join(' / ');
          // check if user approved the sub category
          if (subCategories.includes(subCategory.toLowerCase())) {
            roms.push({
              rom: rowData[0],
              fullCategory: rowData[1],
              category: category,
              subCategory: subCategory,
            });
          }
        }
      }
    }
  });

  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: false,
      message: 'Done.'
    })
  );

  console.log(`${roms.length} roms mapped from ini after applying 'Categories' and 'Sub Categories'.`);

  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `${roms.length} roms mapped from ini after applying 'Categories' and 'Sub Categories'.`
    })
  );

  return roms;
}

function getRomDataFromXMLAndFilter (webSocket, emulator, path, romsWithCategory, gameSettings, extraSettings, extraFilters) {
  const file = fs.existsSync(`${path}/${emulator}.xml`) ? `${path}/${emulator}.xml` : `${path}/${emulator}.dat`;
  console.log(`Preparing to apply 'Games Settings' and 'Extra filters' while reading file ${file}`);
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `Preparing to apply 'Games Settings' and 'Extra filters' while reading file ${file}`
    })
  );
  try {
    console.log(`Please wait, loading file ${file} ...`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Please wait, loading file ${file} ...`
      })
    );
    const xmlData = fs.readFileSync(file, 'utf8');

    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: false,
        message: 'Done'
      })
    );

    console.log('Please wait, converting to json (~30 sec) ...');
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: 'Please wait, converting to json (~30 sec) ...'
      })
    );
    const jsonData = convert.xml2js(xmlData, { compact: true, spaces: 4 });
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: false,
        message: 'Done'
      })
    );

    const romsMapped = [];
    if (jsonData.mame) {
      console.log('Reading data from "jsonData.mame.machine"...');
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: 'Reading data from "jsonData.mame.machine"...'
        })
      );

      jsonData.mame.machine.forEach(rom => {
        const tmp = romMapperM(rom, romsWithCategory, gameSettings, extraSettings, extraFilters);
        // const tmp = debugRomMapperM(rom, romsWithCategory);
        if (tmp !== false) {
          romsMapped.push(tmp);
        }
      });
    } else if (jsonData.datafile) {
      console.log('Reading data from "jsonData.datafile.machine"');
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: 'Reading data from "jsonData.datafile.machine"'
        })
      );

      jsonData.mame.machine.forEach(rom => {
        const tmp = romMapperD(rom, romsWithCategory, gameSettings, extraSettings, extraFilters);
        if (tmp !== false) {
          romsMapped.push(tmp);
        }
      });
    } else {
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `File ${file} is not supported, contact dev to include it.`
        })
      );
    }

    console.log(`${romsMapped.length} roms after applying 'Games Settings' and 'Extra filters'.`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `${romsMapped.length} roms after applying 'Games Settings' and 'Extra filters'.`
      })
    );

    return romsMapped;
  } catch (err) {
    console.error(err);
  }
}

function romMapperM (rom, romsWithCategory, gameSettings, extraSettings, extraFilters) {
  const romCat = romsWithCategory.find(v => v.rom == rom._attributes.name);
  if (!romCat) {
    console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because is excluded from main category/subcategory`);
    return false;
  }

  if (rom._attributes.cloneof && gameSettings.gameUnique == 'true') {
    console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because it is a clone of ${rom._attributes.cloneof}`);
    return false;
  }

  if (
    (rom.driver._attributes.status == 'good' && gameSettings.gameGood) ||
    (rom.driver._attributes.status == 'imperfect' && gameSettings.gameImperfect) ||
    (rom.driver._attributes.status == 'preliminary' && gameSettings.gamePreliminary) ||
    (!gameSettings.gameGood && !gameSettings.gameImperfect && !gameSettings.gamePreliminary)
  ) {
    if (
      extraSettings.length == 0 ||
      (extraSettings.length > 0 && !extraSettings.includes(rom.manufacturer._text.toLowerCase()))
    ) {
      if (
        extraFilters.length == 0 ||
        (extraFilters.length > 0 && !extraFilters.includes(rom.description._text.toLowerCase()))
      ) {
        console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was added!`);
        return {
          rom: rom._attributes.name + '.zip',
          name: rom.description._text,
          category: romCat,
          year: rom.year._text,
          manufacturer: rom.manufacturer._text,
          status: rom.driver._attributes.status
        };
      } else {
        console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because it was excluded in 'Extra Filters' from UI`);
        return false;
      }
    } else {
      console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because manufacturer ${rom.manufacturer._text} was excluded in 'Extra Settings' from UI`);
      return false;
    }
  }

  console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because rom status=${rom.driver._attributes.status}`);
  return false;
}

function romMapperD (rom, romsWithCategory, gameSettings, extraSettings, extraFilters) {
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `TODO: romMapperD work in progress.`
    })
  );
  // TODO
  return false;
}

function excludeRomsRegions (webSocket, romsFromXML, excludeRegions) {
  return romsFromXML;
}
