const HEROES = {
  bcdecks: { command: "bcdecks", hero: "Beta-Carrotina", side: "Plants" },
  ccdecks: { command: "ccdecks", hero: "Captain Combustible", side: "Plants" },
  ctdecks: { command: "ctdecks", hero: "Citron", side: "Plants" },
  czdecks: { command: "czdecks", hero: "Chompzilla", side: "Plants" },
  gkdecks: { command: "gkdecks", hero: "Grass Knuckles", side: "Plants" },
  gsdecks: { command: "gsdecks", hero: "Green Shadow", side: "Plants" },
  ncdecks: { command: "ncdecks", hero: "Night Cap", side: "Plants" },
  rodecks: { command: "rodecks", hero: "Rose", side: "Plants" },
  sfdecks: { command: "sfdecks", hero: "Solar Flare", side: "Plants" },
  spdecks: { command: "spdecks", hero: "Spudow", side: "Plants" },
  wkdecks: { command: "wkdecks", hero: "Wall-Knight", side: "Plants" },
  bfdecks: { command: "bfdecks", hero: "Brain Freeze", side: "Zombies" },
  ebdecks: { command: "ebdecks", hero: "Electric Boogaloo", side: "Zombies" },
  hgdecks: { command: "hgdecks", hero: "Huge-Gigantacus", side: "Zombies" },
  ifdecks: { command: "ifdecks", hero: "Impfinity", side: "Zombies" },
  imdecks: { command: "imdecks", hero: "Immorticia", side: "Zombies" },
  ntdecks: { command: "ntdecks", hero: "Neptuna", side: "Zombies" },
  pbdecks: { command: "pbdecks", hero: "Professor Brainstorm", side: "Zombies" },
  rbdecks: { command: "rbdecks", hero: "Rustbolt", side: "Zombies" },
  sbdecks: { command: "sbdecks", hero: "Super Brainz", side: "Zombies" },
  smdecks: { command: "smdecks", hero: "The Smash", side: "Zombies" },
  zmdecks: { command: "zmdecks", hero: "Z-Mech", side: "Zombies" }
};

const HERO_BY_COMMAND = Object.fromEntries(
  Object.values(HEROES).map((hero) => [hero.command, hero])
);

const HERO_BY_NAME = Object.fromEntries(
  Object.values(HEROES).map((hero) => [hero.hero, hero])
);

const COMMAND_BY_HERO = Object.fromEntries(
  Object.values(HEROES).map((hero) => [hero.hero, hero.command])
);

function getHeroConfig(commandOrHero) {
  return HERO_BY_COMMAND[commandOrHero] || HERO_BY_NAME[commandOrHero] || null;
}

function getHeroCommand(commandOrHero) {
  return getHeroConfig(commandOrHero)?.command || null;
}

function getHeroName(commandOrHero) {
  return getHeroConfig(commandOrHero)?.hero || null;
}

function getHeroSide(commandOrHero) {
  return getHeroConfig(commandOrHero)?.side || null;
}

module.exports = {
  HEROES,
  HERO_BY_COMMAND,
  HERO_BY_NAME,
  COMMAND_BY_HERO,
  getHeroConfig,
  getHeroCommand,
  getHeroName,
  getHeroSide
};