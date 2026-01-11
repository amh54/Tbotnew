const { ActionRowBuilder } = require("discord.js");
/**
 * Handles hero help commands (heroname and herocommand present)
 */
async function handleHeroHelpCommand(row, message, client) {
  try {
    const buildHelpHeroEmbed = require("./buildHelpHeroEmbed");
    const heroCommand = row.herocommand.toString().trim();
    const heroName = row.heroname;
    
    const heroTableMap = {
      'helpbc': 'bcdecks', 'helpct': 'ctdecks', 'helpcc': 'ccdecks',
      'helpcz': 'czdecks', 'helpgk': 'gkdecks', 'helpgs': 'gsdecks',
      'helpnc': 'ncdecks', 'helpro': 'rodecks', 'helpsf': 'sfdecks',
      'helpsp': 'spdecks', 'helpwk': 'wkdecks', 'helpbf': 'bfdecks',
      'helpeb': 'ebdecks', 'helphg': 'hgdecks', 'helpsb': 'sbdecks',
      'helpif': 'ifdecks', 'helpim': 'imdecks', 'helpnt': 'ntdecks',
      'helppb': 'pbdecks', 'helprb': 'rbdecks', 'helpsm': 'smdecks',
      'helpzm': 'zmdecks'
    };
    
    const deckTable = heroTableMap[heroCommand];
    const db = require("../index.js");
    const [decks] = await db.query(`SELECT * FROM ${deckTable}`);
    
    if (!decks || decks.length === 0) {
      return message.channel.send(`No ${heroName} decks found in the database.`);
    }
    
    const { embed, select, deckLists, availableCategories, heroName: returnedHeroName,
            categoryColor, deckColor, thumbnailUrl } = buildHelpHeroEmbed(row, decks);

    const m = await message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(select)]
    });

    if (!client.heroHelpData) {
      client.heroHelpData = new Map();
    }
    
    const tempKey = `temp_${heroCommand}_${m.id}`;
    client.heroHelpData.set(tempKey, {
      heroName: returnedHeroName,
      heroCommand,
      deckLists,
      availableCategories,
      categoryColor,
      deckColor,
      thumbnailUrl
    });

    console.log(`Stored hero help data for message ID: ${m.id}`);
  } catch (error) {
    console.error("Error handling hero help command:", error);
    await message.channel.send("An error occurred while loading hero help data.");
  }
}
module.exports = handleHeroHelpCommand;