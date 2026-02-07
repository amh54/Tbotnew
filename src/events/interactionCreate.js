const { InteractionType } = require("discord.js");
const { handleHangmanModal } = require("../handlers/hangmanHandler.js");
const { handleSlashCommand } = require("../handlers/slashCommandHandler.js");
const { handleMessageComponent } = require("../handlers/messageComponentHandler.js");
const { handleAutocomplete } = require("../handlers/autocompleteHandler.js");

module.exports = {
  name: "interactionCreate",
  async run(interaction) {
    const client = interaction.client;
    const db = require("../../index.js");

    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.startsWith("hangman-")) {
        return await handleHangmanModal(interaction);
      }
    }
    
    if (interaction.type === InteractionType.ApplicationCommand) {
      return await handleSlashCommand(interaction);
    }
    
    if (interaction.type === InteractionType.MessageComponent) {
      return await handleMessageComponent(interaction, db, client);
    }
    
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return await handleAutocomplete(interaction);
    }
  },
};