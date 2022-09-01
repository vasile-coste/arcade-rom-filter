// page vars
let loading = false;
const defaultCategories = [
  "Arcade",
  "Fighter",
  "Platform",
  "Shooter",
];
const defaultSubCategories = [
  '2.5D',
  '2D',
  'Fighter',
  'Fighter Scrolling',
  'Flying Horizontal',
  'Flying Vertical',
  'Run Jump',
  'Run, Jump & Scrolling',
  'Shooter',
  'Shooter Scrolling',
  'Versus',
  'Versus Co-op',
  'Vertical'
];
const mainCategories = ['Arcade', 'Ball & Paddle', 'Board Game', 'Calculator', 'Casino', 'Climbing', 'Computer', 'Computer Graphic Workstation', 'Digital Simulator', 'Driving', 'Electromechanical', 'Fighter', 'Game', 'Game Console', 'Handheld', 'Maze', 'Medal Game', 'Medical Equipment', 'Misc.', 'MultiGame', 'Multiplay', 'Music', 'Music Game', 'Platform', 'Printer', 'Puzzle', 'Quiz', 'Redemption Game', 'Shooter', 'Simulation', 'Slot Machine', 'Sports', 'System', 'Tablet', 'Tabletop', 'Telephone', 'Touchscreen', 'TTL * Ball & Paddle', 'TTL * Driving', 'TTL * Maze', 'TTL * Quiz', 'TTL * Shooter', 'TTL * Sports', 'Utilities', 'Watch', 'Whac-A-Mole'];
const subCategories = ['1st Person', '2.5D', '2D', '3D', '3rd Person', 'Command', 'Compilation', 'Driving', 'Driving (chase view)', 'Driving 1st Person', 'Driving Diagonal', 'Driving Horizontal', 'Driving Vertical', 'Field', 'Fighter', 'Fighter Scrolling', 'Flying', 'Flying (chase view)', 'Flying * Mature *', 'Flying 1st Person', 'Flying Diagonal', 'Flying Horizontal', 'Flying Horizontal * Mature *', 'Flying Vertical', 'Flying Vertical * Mature *', 'Gallery', 'Gallery * Mature *', 'Gun', 'Maze', 'Misc.', 'Misc. Horizontal', 'Misc. Vertical', 'Motorbike', 'Multiplay', 'Outline * Mature *', 'Pinball', 'Pinball * Mature *', 'Run Jump', 'Run Jump * Mature *', 'Run, Jump & Scrolling', 'Shooter', 'Shooter Scrolling', 'Submarine', 'Underwater', 'Versus', 'Versus * Mature *', 'Versus Co-op', 'Vertical', 'Walking'];
const regions = [
  'asia',
  'china',
  'germany',
  'holland',
  'hong kong',
  'italy',
  'japan',
  'korea',
  'spain',
  'switzerland',
  'taiwan'
];
const excludeGamesContaining = [
  'prototype',
  'bootleg',
  'hack',
  'playchoice-10',
];

const excludeGamesConsideredClones = [
  "1943 Kai: Midway Kaisen",
  "1943: Battle of Midway",
  "1943: Midway Kaisen",
  "Akuu Gallet",
  "Arcana Heart",
  "Art of Fighting - Ryuuko no Ken Gaiden",
  "Bakutotsu Kijuutei",
  "Bare Knuckle III / Sunset Riders",
  "Batsugun",
  "Battle Bakraid",
  "Battle Garegga",
  "Battle K-Road",
  "Battle Tryst",
  "Bionic Commandos",
  "Bishoujo Senshi Sailor Moon",
  "Black Tiger",
  "Black Tiger / Black Dragon",
  "Bonanza Bros",
  "Bubble Bobble: Lost Cave V1.",
  "Bubble Bobble: Lost Cave V1.0",
  "Bubble Symphony",
  "Buriki One: World Grapple Tournament '99 in Tokyo",
  "Chou Zetsurinjin Berabowman",
  "Chulgyeok D-Day",
  "Cosmic Cop",
  "Cybattler",
  "Cyber Troopers Virtual-On",
  "Cyberbots: Fullmetal Madness",
  "Dan-Ku-Ga",
  "Darius Extra Version",
  "Darius Gaiden - Silver Hawk Extra Version",
  "Datsugoku - Prisoners of War",
  "Deathsmiles",
  "DoDonPachi - Feng Bao",
  "DoDonPachi Dai-Fukkatsu",
  "DoDonPachi Dai-Fukkatsu Black Label",
  "DoDonPachi Dai-Ou-Jou",
  "DoDonPachi II - Fung Bou",
  "Dragon Ball Z V.R.V.S.",
  "Dragonninja",
  "Dynamite B",
  "Dynamite D",
  "ESP Ra.De.",
  "Fantasy Land",
  "Fantasy Zone",
  "Fatal Fury Special / Garou Densetsu Special",
  "Fighting Fantasy",
  "Final Crash",
  "Fist Of The North Star",
  "G-Darius",
  "Galaxy Fight - Universal Warriors",
  "Galaxy Gunners",
  "Ghost Chaser Densei",
  "Gouketsuji Gaiden - Saikyou Densetsu",
  "Gundam Wing: Endless Duel",
  "Gundam vs. Gundam",
  "Heavy Unit -U.S.A. Version-",
  "Jackie Chan",
  "Jiao! Jiao! Jiao!",
  "JoJo no Kimyou na Bouken: Mirai e no Isan",
  "JoJo's Venture",
  "JuJu Densetsu",
  "Kero Kero Keroppi no Isshoni Asobou",
  "King of Gladiator",
  "Kizuna Encounter - Super Tag Battle / Fu'un Super Tag Battle",
  "Knights of Valour 2 / Sanguo Zhan Ji 2 / Sangoku Senki 2",
  "Knights of Valour / Sanguo Zhan Ji / Sangoku Senki",
  "Kodai Ouja Kyouryuu King - Mezame yo! Arata-naru Chikara!!",
  "MX5000",
  "Mahou Daisakusen",
  "Mahou Keibitai Gun Hohki",
  "Martial Masters",
  "Melty Blood Act Cadenza",
  "Metal Slug 2 Turbo",
  "Metal Slug 4 Plus",
  "Metal Slug 5 Plus",
  "Mobile Suit Gundam EX Revue",
  "Moyu Zhanxian",
  "Mushihime-Sama Futari",
  "Mutant Warrior",
  "NeoGeo Battle Coliseum",
  "Omega Fighter Special",
  "Oni - The Ninja Master",
  "Opa Opa",
  "Oriental Legend Special",
  "P-47",
  "Pae Wang Jeon Seol",
  "Pink Sweets: Ibara Sorekara",
  "Pistol Daimyo no Bouken",
  "Progear no Arashi",
  "Psyvariar",
  "R-Shark",
  "R-Type",
  "Raiden Fighters 2 - Operation Hell Dive 2000",
  "Raiden II New / Raiden DX",
  "Real Bout Fatal Fury",
  "SD Fighters",
  "SD Gundam Sangokushi Rainbow",
  "SNK vs. Capcom - SVC Chaos Plus",
  "Saboten Bombers",
  "Sai Yu Gou Ma Roku",
  "Same! Same! Same!",
  "Samurai Shodown V Special",
  "Sanguo Qunying Chuan Zhengzong Plus",
  "Sanguo Zhan Ji 2 Gaishi Yingxiong",
  "Saulabi Spirits / Jin Saulabi Tu Hon",
  "SegaSonic The Hedgehog",
  "Senko no Rond",
  "Shikigami no Shiro - internal build",
  "Soul Edge Ver. II",
  "Street Fighter EX",
  "Street Fighter EX2",
  "Street Fighter II' Turbo: Hyper Fighting",
  "Street Fighter II': Champion Edition",
  "Street Fighter II': Hyper Fighting",
  "Street Fighter II': Magic Delta Turbo",
  "Street Fighter II': Magic KO Turbo!! - Nightmare Crack",
  "Street Fighter III 2nd Impact: Giant Attack",
  "Street Fighter III: New Generation",
  "Street Fighter Zero 2 Alpha",
  "Street Fighter Zero 3 Upper",
  "Street Fighter: The Movie",
  "Street Smart / Final Fight",
  "Super Athena",
  "Super Bobble Bobble",
  "Super Bubble Bobble",
  "Super Gem Fighter: Mini Mix",
  "Super Street Fighter II - The New Challengers",
  "Super Street Fighter II Turbo",
  "Super Street Fighter II: The New Challengers Super 2",
  "Super Street Fighter II: The Tournament Battle",
  "Teenage Mutant Ninja Turtles II: The Arcade Game",
  "The Key Of Avalon 1",
  "The Key Of Avalon 2",
  "The King of Fighters '98: Ultimate Match HERO",
  "The King of Fighters - Fuchou Zhi Lu",
  "The King of Fighters 10th Anniversary",
  "The King of Fighters 2002 Magic Plus",
  "The King of Fighters 2002 Plus",
  "The King of Fighters 2004 Plus",
  "Trigger Heart Exelica Ver.A",
  "Undercover Cops - Alpha Renewal Version",
  "Vamp x1/2",
  "Virtua Fighter 3 Team Battle",
  "Virtua Fighter 4 Version C",
  "Virtua Fighter 4: Evolution",
  "Virtua Fighter Remix",
  "Wonsido 1930's",
  "Xain'd Sleena",
  "Xiyou Shi E Chuan 2",
  "Xiyou Shi E Chuan Super",
  "crouching tiger hidden dragon",
  "mortal kombat",
  "tekken",
  "unknown fighting game",
];

// regions.sort();
// console.log(regions)

addCategories(mainCategories, defaultCategories);
addSubCategories(subCategories, defaultSubCategories);
addRegions(regions);
addGameExtras(excludeGamesContaining);
addGameClones(excludeGamesConsideredClones);

async function filterGames () {
  const emulator = localStorage.getItem('emulator');
  const default_files = localStorage.getItem('emulator');

  const data = await $.ajax({
    url: '/checkFile',
    type: 'POST',
    data: {
      emulator,
      default_files
    }
  });
}

function addCategories (items, defaults) {
  let cnt = 0;
  items.forEach(item => {
    $("#categories").append(
      `
      <div class="w-full hover:bg-gray-200 px-1">
          <input type="checkbox" class="categories" ${defaults.includes(item) ? 'checked' : ''} value="${item}" id="cat-${cnt}">
          <label class="cursor-pointer" for="cat-${cnt}">${item}</label>
      </div>
      `
    );
    cnt++;
  });
}

function addSubCategories (items, defaults) {
  let cnt = 0;
  items.forEach(item => {
    $("#sub-categories").append(
      `
      <div class="w-full hover:bg-gray-200 px-1">
          <input type="checkbox" class="sub-categories" ${defaults.includes(item) ? 'checked' : ''} value="${item}" id="sub-cat-${cnt}">
          <label class="cursor-pointer" for="sub-cat-${cnt}">${item}</label>
      </div>
      `
    );
    cnt++;
  });
}

function addRegions (items) {
  let cnt = 0;
  items.forEach(item => {
    $("#regions").append(
      `
      <div class="w-full hover:bg-gray-200 px-1">
          <input type="checkbox" class="regions" checked value="${item}" id="region-${cnt}">
          <label class="cursor-pointer" for="region-${cnt}">${item}</label>
      </div>
      `
    );
    cnt++;
  });
}

function addGameExtras (items) {
  let cnt = 0;
  items.forEach(item => {
    $("#game-extra").append(
      `
      <div class="w-full hover:bg-gray-200 px-1">
          <input type="checkbox" class="game-extra" checked value="${item}" id="game-extra-${cnt}">
          <label class="cursor-pointer" for="game-extra-${cnt}">Exclude games with ${item}</label>
      </div>
      `
    );
    cnt++;
  });
}

function addGameClones (items) {
  let cnt = 0;
  items.forEach(item => {
    $("#game-clones").append(
      `
      <div class="w-full hover:bg-gray-200 px-1">
          <input type="checkbox" class="game-clones" checked value="${item}" id="game-clone-${cnt}">
          <label class="cursor-pointer" for="game-clone-${cnt}">${item}</label>
      </div>
      `
    );
    cnt++;
  });
}