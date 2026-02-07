const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const { handleCardInfo } = require("./cardInfoHandler.js");
const { handleDetectDecks } = require("./detectDecksHandler.js");
const { handleDeckBuilderCategory } = require("./deckBuilderHandler.js");
const { 
  handleHeroHelp, 
  handleHeroDeckCategory, 
  handleHeroDeckNavigation, 
  handleHeroDeckBackToList,
  handleHeroCategorySelect 
} = require("./heroHandler.js");

async function handleMessageComponent(interaction, db, client) {
  const { customId } = interaction;

  if (customId.startsWith("cardinfo_")) {
    return await handleCardInfo(interaction, db);
  }
  
  if (customId.startsWith("detectdecks_")) {
    const handled = await handleDetectDecks(interaction, db);
    if (handled) return;
  }
  
  if (customId.startsWith("deckbuildercat_")) {
    return await handleDeckBuilderCategory(interaction);
  }

  if (customId.startsWith("herocat_")) {
    return await handleHeroCategorySelect(interaction);
  }

  if (customId.startsWith("herohelp_")) {
    return await handleHeroHelp(interaction, db, client);
  }

  if (customId.startsWith("herodeck_")) {
    return await handleHeroDeckCategory(interaction);
  }

  if (customId.startsWith("herodknav_")) {
    return await handleHeroDeckNavigation(interaction);
  }

  if (customId.startsWith("herodklist_")) {
    return await handleHeroDeckBackToList(interaction);
  }

  if (customId.startsWith("hangman-")) {
    return await showHangmanModal(interaction);
  }
}

async function showHangmanModal(interaction) {
  const type = interaction.customId.split("-").at(-1);

  const modal = new ModalBuilder()
    .setTitle(`Guess a ${type}`)
    .setCustomId(`hangman-guess-modal-${type}`);

  const modalInput = new TextInputBuilder()
    .setCustomId(`hangman-${type}-input-field`)
    .setLabel(`What ${type} would you like to guess?`)
    .setMinLength(type === "letter" ? 1 : 2)
    .setMaxLength(type === "letter" ? 1 : 25)
    .setStyle(TextInputStyle.Short);

  const row = new ActionRowBuilder({
    components: [modalInput],
  });

  modal.addComponents(row);

  await interaction.showModal(modal);
}

module.exports = { handleMessageComponent };
