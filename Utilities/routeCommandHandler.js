const handleHeroWithCardButton = require("./handleHeroWithCardButton");
const handleHeroCommand = require("./handleHeroCommand");
const handleHeroHelpCommand = require("./handleHeroHelpCommand");
const handleSuperpowerOrToken = require("./handleSuperpowerOrToken");
const handleCardsWithOneButton = require("./handleCardsWithOneButton");
const handleCardsWithTwoButtons = require("./handleCardsWithTwoButtons");
const handleCardWithoutButton = require("./handleCardWithoutButton");
const handleDeckbuilderProfile = require("./handleDeckBuilderProfile");
const handleDeckDisplay = require("./handleDeckDisplay");

/**
 * Routes to appropriate handler based on row properties
 */
function routeCommandHandler(row, client, message, args, tableConfig, dbTableColors) {
  // Hero commands
  if (row.heroname && row.hero_emoji && row.herocard_button) {
    return handleHeroWithCardButton(row, message);
  }
  
  if (row.heroname && row.hero_emoji && !row.herocommand) {
    return handleHeroCommand(row, message);
  }
  
  if (row.heroname && row.herocommand) {
    return handleHeroHelpCommand(row, message, client);
  }
  
  // Superpowers and tokens
  if (row.description?.includes("Superpower") || row.set_rarity === "Token") {
    return handleSuperpowerOrToken(row, message, tableConfig, dbTableColors);
  }
  
  // Cards with buttons
  if (row.stats && row.button && row.button2) {
    return handleCardsWithTwoButtons(row, message, tableConfig, dbTableColors);
  }
  
  if (row.stats && row.button) {
    return handleCardsWithOneButton(row, message, tableConfig, dbTableColors);
  }
  
  if (row.stats && !row.button) {
    return handleCardWithoutButton(row, message, tableConfig, dbTableColors);
  }
  
  // Deckbuilder profile
  if (row.deckbuilder_name) {
    return handleDeckbuilderProfile(row, message, client);
  }
  
  // Default: treat as standard deck
  return handleDeckDisplay(row, message, tableConfig, dbTableColors);
}

module.exports = routeCommandHandler;
