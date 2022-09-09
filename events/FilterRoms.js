const fs = require("fs");
const path = require('path');
const convert = require('xml-js');
const { createFile, getFilesize } = require('./File.js');

module.exports = function (data, webSocket) {
  const dir = path.resolve('./');

  /**
   * For FB Neo we do not have any categories / sub categories
   * */
  let romsWithCategory = [];
  if (
    data.categories && data.categories.length > 0 &&
    data.subCategories && data.subCategories.length > 0
  ) {
    /**  
     * Filter roms by category and sub category and return an object
     * */
    const romsWithCategory = getRomCategoriesFromIniAndFilter(
      webSocket,
      data.emulator,
      dir,
      data.categories.map(string => string.toLowerCase()),
      data.subCategories.map(string => string.toLowerCase())
    );
    if (romsWithCategory.length == 0) {
      return noRomsToFilter(webSocket);
    }
  }

  /**  
   * Read xml or dat file and apply more filters
   * */
  const romsFromXML = getRomDataFromXMLAndFilter(
    webSocket,
    data.emulator,
    dir,
    romsWithCategory,
    data.gameSettings,
    data.extraSettings.map(string => string.toLowerCase()),
    data.extraFilters.map(string => string.toLowerCase())
  );
  if (romsFromXML.length == 0) {
    return noRomsToFilter(webSocket);
  }

  /**  
   * Remove roms duplicate and regions
   * */
  const finalRoms = excludeRomsRegions(
    webSocket,
    romsFromXML.games,
    data.excludeRegions.map(string => string.toLowerCase()),
    data.gameSettings.gameDuplicates
  );
  if (finalRoms.length == 0) {
    return noRomsToFilter(webSocket);
  }

  /**  
   * Create a json file with filtered roms to copy / save
   * */
  createFile(dir, data.emulator, finalRoms.concat(romsFromXML.bios));

  sendWsSignal(webSocket, 'Filter worked finished!');

  webSocket.send(
    JSON.stringify({
      event: 'next',
      message: 'next step'
    })
  );
};

/**
 * Stop process when no roms found to copy / save
 * */
function noRomsToFilter (webSocket, msg = null) {
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: msg ?? 'No roms to filter!'
    })
  );

  webSocket.send(
    JSON.stringify({
      event: 'finish',
      message: null
    })
  );
}

/**
 * Send a log signal to show in fronend
 */
function sendWsSignal (webSocket, msg, newLine = true) {
  console.log(msg)
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: newLine,
      message: msg
    })
  );
}

/**  
 * Filter roms by category and sub category and return an object
 * */
function getRomCategoriesFromIniAndFilter (webSocket, emulator, path, categories, subCategories) {
  const file = `${path}/${emulator}.ini`;
  const roms = [];
  let data = null;

  sendWsSignal(webSocket, `Filtering and mapping 'Categories' and 'Sub Categories' from file ${file} ...`);

  try {
    data = fs.readFileSync(file, 'utf8');
  } catch (err) {
    sendWsSignal(webSocket, JSON.stringify(err));
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

  sendWsSignal(webSocket, 'Done.', false);
  sendWsSignal(webSocket, `${roms.length} roms mapped from ini after applying 'Categories' and 'Sub Categories'.`);

  return roms;
}

/**  
 * Read xml or dat file and apply more filters
 * */
function getRomDataFromXMLAndFilter (webSocket, emulator, path, romsWithCategory, gameSettings, extraSettings, extraFilters) {
  const file = fs.existsSync(`${path}/${emulator}.xml`) ? `${path}/${emulator}.xml` : `${path}/${emulator}.dat`;
  
  const romsMapped = {
    games: [],
    bios: []
  };

  sendWsSignal(webSocket, `Preparing to apply 'Games Settings' and 'Extra filters' while reading file ${file}`);
  try {
    sendWsSignal(webSocket, `Please wait, loading file ${file} ...`);
    const xmlData = fs.readFileSync(file, 'utf8');

    sendWsSignal(webSocket, 'Done', false);

    sendWsSignal(webSocket, `Please wait, converting to json (filesize = ${getFilesize(file)}) ...`);
    const jsonData = convert.xml2js(xmlData, { compact: true, spaces: 4 });
    sendWsSignal(webSocket, 'Done.', false);

    if (jsonData.mame || jsonData.datafile) {
      sendWsSignal(webSocket, `Reading data from 'datafile.machine', there are ${jsonData.datafile.machine.length} roms to filter ...`);

      let datRoms = [];
      // check what to iterate
      if (jsonData.mame){
        datRoms = jsonData.mame.machine;
      } else {
        datRoms = jsonData.datafile.machine && jsonData.datafile.machine.length > 0 ?
          jsonData.datafile.machine :
          (jsonData.datafile.game && jsonData.datafile.game.length > 0 ? jsonData.datafile.game : []);
      }

      datRoms.forEach(rom => {
        const tmp = romMapper(rom, gameSettings, extraSettings, extraFilters, romsWithCategory);
        if (tmp !== false) {
          if (tmp.status == 'isbios') {
            romsMapped.bios.push(tmp);
          } else {
            romsMapped.games.push(tmp);
          }
        }
      });
    } else {
      sendWsSignal(webSocket, `File ${file} is not supported, contact dev to include it.`);
    }

    sendWsSignal(webSocket, `${romsMapped.length} roms after applying 'Games Settings' and 'Extra filters'.`);

  } catch (err) {
    console.error(err);
  }

  return romsMapped;
}

/**
 * Create json object for copy / save roms
 */
function romMapper (rom, gameSettings, extraSettings, extraFilters, romsWithCategory = []) {
  // check for bios
  if (rom._attributes.isbios && rom._attributes.isbios == 'yes') {
    return {
      rom: rom._attributes.name + '.zip',
      name: rom.description._text,
      year: rom.year._text,
      manufacturer: rom.manufacturer._text,
      status: 'isbios'
    }
  }

  // check for rom categories
  let romCat = null;
  if (romsWithCategory.length > 0) {
    romCat = romsWithCategory.find(v => v.rom == rom._attributes.name);
    if (!romCat) {
      console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because is excluded from main category/subcategory`);
      return false;
    }
  }

  // check for clones, note that some xml/dat do not have this property
  if (rom._attributes.cloneof && gameSettings.gameClones) {
    console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because it is a clone of ${rom._attributes.cloneof}`);
    return false;
  }

  // some xml/dat files have a driver property and some don't
  let gameStatus = true;
  let romStatus = null;
  if (rom.driver) {
    gameStatus = (rom.driver._attributes.status == 'good' && gameSettings.gameGood) ||
      (rom.driver._attributes.status == 'imperfect' && gameSettings.gameImperfect) ||
      (rom.driver._attributes.status == 'preliminary' && gameSettings.gamePreliminary) ||
      (!gameSettings.gameGood && !gameSettings.gameImperfect && !gameSettings.gamePreliminary);
    romStatus = rom.driver._attributes.status;
  } else {
    // loop trough all 'rom' properties
    const checkRomStatus = rom.rom.length > 0 ? rom.rom.filter(r => r._attributes.status && r._attributes.status == 'baddump') : [];
    gameStatus = (checkRomStatus.length == 0 && gameSettings.gameGood) ||
      (checkRomStatus.length > 0 && gameSettings.gameImperfect || gameSettings.gamePreliminary) ||
      (!gameSettings.gameGood && !gameSettings.gameImperfect && !gameSettings.gamePreliminary);
    romStatus = checkRomStatus.length == 0 ? 'good' : 'imperfect|preliminary';
  }

  if (gameStatus) {
    const checkExtraSettings = extraSettings.filter(filter => rom.manufacturer._text.toLowerCase().includes(filter));
    if (
      extraSettings.length == 0 ||
      (extraSettings.length > 0 && checkExtraSettings.length == 0)
    ) {
      const checkExtraFilters = extraFilters.filter(filter => rom.description._text.toLowerCase().includes(filter));
      if (
        extraFilters.length == 0 ||
        (extraFilters.length > 0 && checkExtraFilters.length == 0)
      ) {
        console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was added!`);
        const groupArr = rom.description._text == 'Double Dragon (Neo-Geo)' ? [rom.description._text] : rom.description._text.split('(');
        return {
          rom: rom._attributes.name + '.zip',
          name: rom.description._text,
          group: groupArr[0].trim(),
          category: romCat,
          year: rom.year._text,
          manufacturer: rom.manufacturer._text,
          status: romStatus
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

/**  
 * Remove roms duplicate and regions
 * */
function excludeRomsRegions (webSocket, romsFromXML, excludeRegions, gameDuplicates) {
  let roms = [];
  if (gameDuplicates) {
    sendWsSignal(webSocket, `Preparing to apply 'Exclude Region (Duplicates)' filter to remove all duplicates and keeping only one rom`);

    // map roms with same name
    const romsGrouped = new Map();
    romsFromXML.forEach(rom => {
      if (romsGrouped.has(rom.group)) {
        romsGrouped.set(rom.group, romsGrouped.get(rom.group).concat([rom]));
      } else {
        romsGrouped.set(rom.group, [rom]);
      }
    });

    console.log(`Filtering grouped roms...`);

    // remove duplicates
    romsGrouped.forEach(romArr => {
      if (romArr.length == 1) {
        console.log(`Only 1 rom found will add as final rom: ${romArr[0].name}`);
        roms.push(romArr[0]);
      } else {
        const tmpArr = romArr.filter(rom => {
          const check = excludeRegions.filter(region => rom.name.toLowerCase().includes(region));
          console.log(`ROM name ${rom.name} ${check.length > 0 ? 'is excluded, has region ' + check.join('|') : 'is marked as accepted'} `);
          return check.length > 0 ? false : true;
        });
        console.log(`Found ${tmpArr.length} rom(s) after region filters, will add as final rom: ${tmpArr.length > 0 ? tmpArr[0].name : romArr[0].name}`);
        roms.push(tmpArr.length > 0 ? tmpArr[0] : romArr[0]);
      }
    })

  } else {
    sendWsSignal(webSocket, `Preparing to apply 'Exclude Region' filter ...`);

    roms = romsFromXML.filter(rom => {
      const check = excludeRegions.filter(region => rom.name.toLowerCase().includes(region));
      console.log(`ROM name ${rom.name} ${check.length > 0 ? ' is excluded' : 'is accepted'} `);
      return check.length > 0 ? false : true;
    });
  }

  sendWsSignal(webSocket, 'Done', false);
  sendWsSignal(webSocket, `${roms.length} roms found after applying '${gameDuplicates ? 'Exclude Region (Duplicates)' : 'Exclude Region'}'`);

  return roms;
}
