const {
  HEROES,
  HERO_BY_COMMAND,
  HERO_BY_NAME,
  getHeroConfig,
  getHeroCommand,
  getHeroName,
  getHeroSide
} = require("./heroDeckConfig.js");

const commandToHeroMap = {};
const heroTableMap = {};
const heroNameToTable = {};

for (const hero of Object.values(HEROES)) {
  const helpCommand = `help${hero.command.replace("decks", "")}`;
  commandToHeroMap[helpCommand] = hero.hero;
  heroTableMap[helpCommand] = hero.command;
  heroNameToTable[hero.hero] = hero.command;
}

module.exports = {
  HEROES,
  HERO_BY_COMMAND,
  HERO_BY_NAME,
  commandToHeroMap,
  heroTableMap,
  heroNameToTable,
  getHeroConfig,
  getHeroCommand,
  getHeroName,
  getHeroSide
};
