const fs = require("fs");
const path = require('path');
const convert = require('xml-js');
const { createFile, getFilesize } = require('./File.js');

module.exports = function (data, webSocket) {
  const dir = path.resolve('./');

  const romsWithCategory = getRomCategoriesFromIniAndFilter(
    webSocket,
    data.emulator,
    dir,
    data.categories.map(string => string.toLowerCase()),
    data.subCategories.map(string => string.toLowerCase())
  );
  if(romsWithCategory.length == 0) {
    return false;
  }

  const romsFromXML = getRomDataFromXMLAndFilter(
    webSocket,
    data.emulator,
    dir,
    romsWithCategory,
    data.gameSettings,
    data.extraSettings.map(string => string.toLowerCase()),
    data.extraFilters.map(string => string.toLowerCase())
  );
  if(romsFromXML.length == 0) {
    return false;
  }

  const finalRoms = excludeRomsRegions(
    webSocket,
    romsFromXML,
    data.excludeRegions.map(string => string.toLowerCase()),
    data.gameSettings.gameDuplicates
  );
  if(finalRoms.length == 0) {
    return false;
  }

  // create a file
  createFile(dir, data.emulator, finalRoms);

  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: 'Filter worked finished!'
    })
  );

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

    console.log(`Please wait, converting to json (filesize = ${getFilesize(file)}) ...`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Please wait, converting to json (filesize = ${getFilesize(file)}) ...`
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
      console.log(`Reading data from 'mame.machine', there are ${jsonData.mame.machine.length} roms to filter ...`);
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Reading data from 'mame.machine', there are ${jsonData.mame.machine.length} roms to filter ...`
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
      console.log(`Reading data from 'datafile.machine', there are ${jsonData.datafile.machine.length} roms to filter ...`);
      webSocket.send(
        JSON.stringify({
          event: 'log',
          newLine: true,
          message: `Reading data from 'datafile.machine', there are ${jsonData.datafile.machine.length} roms to filter ...`
        })
      );

      jsonData.datafile.machine.forEach(rom => {
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

  if (rom._attributes.cloneof && gameSettings.gameClones) {
    console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because it is a clone of ${rom._attributes.cloneof}`);
    return false;
  }

  if (
    (rom.driver._attributes.status == 'good' && gameSettings.gameGood) ||
    (rom.driver._attributes.status == 'imperfect' && gameSettings.gameImperfect) ||
    (rom.driver._attributes.status == 'preliminary' && gameSettings.gamePreliminary) ||
    (!gameSettings.gameGood && !gameSettings.gameImperfect && !gameSettings.gamePreliminary)
  ) {
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
  const romCat = romsWithCategory.find(v => v.rom == rom._attributes.name);
  if (!romCat) {
    console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because is excluded from main category/subcategory`);
    return false;
  }

  // this cannot be done
  // gameSettings.gameClones

  // check rom status
  const romStatus = rom.rom.length > 0 ? rom.rom.filter(r => r._attributes.status && r._attributes.status == 'baddump') : [];

  if (
    (romStatus.length == 0 && gameSettings.gameGood) ||
    (romStatus.length > 0 && gameSettings.gameImperfect || gameSettings.gamePreliminary) ||
    (!gameSettings.gameGood && !gameSettings.gameImperfect && !gameSettings.gamePreliminary)
  ) {
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
          status: romStatus.length == 0 ? 'good' : 'imperfect|preliminary'
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

  console.log(`ROM ${rom._attributes.name} with name ${rom.description._text} was skipped because rom status=${romStatus.length == 0 ? 'good' : 'imperfect|preliminary'}`);
  return false;
}


function excludeRomsRegions (webSocket, romsFromXML, excludeRegions, gameDuplicates) {
  let roms = [];
  if (gameDuplicates) {
    console.log(`Preparing to apply 'Exclude Region (Duplicates)' filter to remove all duplicates and keeping only one rom`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Preparing to apply 'Exclude Region (Duplicates)' filter to remove all duplicates and keeping only one rom`
      })
    );
    console.log(`Grouping roms...`);

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
    console.log(`Preparing to apply 'Exclude Region' filter ...`);
    webSocket.send(
      JSON.stringify({
        event: 'log',
        newLine: true,
        message: `Preparing to apply 'Exclude Region' filter ...`
      })
    );

    roms = romsFromXML.filter(rom => {
      const check = excludeRegions.filter(region => rom.name.toLowerCase().includes(region));
      console.log(`ROM name ${rom.name} ${check.length > 0 ? ' is excluded' : 'is accepted'} `);
      return check.length > 0 ? false : true;
    });
  }

  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: false,
      message: `Done`
    })
  );

  console.log(`${roms.length} roms found after applying '${gameDuplicates ? 'Exclude Region (Duplicates)' : 'Exclude Region'}'`);
  webSocket.send(
    JSON.stringify({
      event: 'log',
      newLine: true,
      message: `${roms.length} roms found after applying '${gameDuplicates ? 'Exclude Region (Duplicates)' : 'Exclude Region'}'`
    })
  );

  return roms;
}
