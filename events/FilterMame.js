const fs = require("fs");
const convert = require('xml-js');

module.exports = function (data, path) {
  const romsWithCategory = setRomCategories(data.emulator, path, data.categories, data.subCategories);
  const romsFromXML = getRomDataFromXMLAndFilter(data.emulator, path, romsWithCategory, data.gameSettings);
  const finalRoms = excludeRoms(data.regions, data.gameExtra, data.gameClones);

  //
  createFile(romsFromXML, path);

  return finalRoms;
};


function setRomCategories (emulator, path, categories, subCategories) {
  const file = `${path}/${emulator}.ini`;
  const roms = {};
  try {
    const data = fs.readFileSync(file, 'utf8');
    const rows = data.split("\n");
    rows.forEach(row => {
      if (row != "") {
        const currentRow = String(row).trim();
        if (currentRow != "") {
          // extract rom and full category
          const rowData = currentRow.split('=')
          if (rowData.length == 2) {
            // extract main category
            const cat = rowData[1].split(' / ');
            const category = cat[0].trim();
            // check if user approved the main category
            if (categories.includes(category)) {
              cat.shift();
              // extract sub category
              const subCategory = cat.join(' / ');
              // check if user approved the sub category
              if (subCategories.includes(subCategory)) {
                roms[rowData[0]] = {
                  category: category,
                  subCategory: subCategory,
                  fullCategory: rowData[1],
                }
              }
            }
          }
        }
      }
    });
    return roms;

  } catch (err) {
    console.error(err);
  }
}

function getRomDataFromXMLAndFilter (emulator, path, romsWithCategory, gameSettings) {
  const file = fs.existsSync(`${path}/${emulator}.xml`) ? `${path}/${emulator}.xml` : `${path}/${emulator}.dat`;
  try {
    console.log('Reading ' + file);
    const xmlData = fs.readFileSync(file, 'utf8');

    console.log('Converting to json ...');
    const jsonData = convert.xml2js(xmlData, { compact: true, spaces: 4 });

    console.log('Mapping roms to their category/subcategory.');
    const romsMapped = [];
    if (jsonData.mame) {
      console.log('Reading data from "jsonData.mame.machine"');
      jsonData.mame.machine.forEach(rom => {
        const tmp = romMapperM(rom, romsWithCategory, gameSettings);
        if (tmp !== false) {
          romsMapped.push(tmp);
        }
      });
    } else if (jsonData.datafile) {
      console.log('Reading data from "jsonData.datafile.machine"');
      jsonData.mame.machine.forEach(rom => {
        const tmp = romMapperD(rom, romsWithCategory, gameSettings);
        if (tmp !== false) {
          romsMapped.push(tmp);
        }
      });
    } else {
      console.log(`File ${file} is not supported, contact dev to include it.`);
    }

    return romsMapped;
  } catch (err) {
    console.error(err);
  }
}

function romMapperM (rom, romsWithCategory, gameSettings) {
  const romName = rom._attributes.name;
  if (!romsWithCategory[romName]) {
    // not found
    return false;
  }

  if (rom._attributes.cloneof && gameSettings.gameUnique == 'true') {
    // game is a clone
    return false;
  }

  if (rom.driver._attributes.status != 'good' && gameSettings.gameGood == 'true') {
    // game is not good
    return false;
  }

  if (rom.driver._attributes.status != 'imperfect' && gameSettings.gameImperfect == 'true') {
    // game is not good
    return false;
  }

  if (rom.driver._attributes.status != 'preliminary' && gameSettings.gamePreliminary == 'true') {
    // game is not good
    return false;
  }

  return {
    rom: romName + '.zip',
    name: rom.description._text,
    category: romsWithCategory[romName],
    year: rom.year._text,
    manufacturer: rom.manufacturer._text,
    status: rom.driver._attributes.status
  };
}

function romMapperD (rom, romsWithCategory, gameSettings) {
  console.log(`TODO: work in progress.`);
  // TODO
  return false;
}

function excludeRoms (regions, gameExtra, gameClones) {

}

function createFile (data, path) {

  // let unique = [...new Set(data)];
  // unique.sort();

  if (fs.existsSync(path + '/zzz.json')) {
    console.log('Delete old dump file');
    fs.unlinkSync(path + '/zzz.json');
  }
  console.log('Saving dump file');
  fs.appendFile(path + '/zzz.json', JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('subcategs Saved!');
  });
}
