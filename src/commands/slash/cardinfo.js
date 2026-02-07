const { SlashCommandBuilder } = require("discord.js");
const { startCardInfoByName } = require("../../handlers/cardInfoHandler.js");
const {
  getCardAutocompleteResults,
  resolveCardName
} = require("../../features/cards/cardAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cardinfo")
    .setDescription("View detailed information about a card")
    .addStringOption((option) =>
      option
        .setName("card")
        .setDescription("Card name")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    try {
      const db = require("../../../index.js");
      const focusedValue = interaction.options.getFocused();
      const results = await getCardAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    const db = require("../../../index.js");
    const cardInput = interaction.options.getString("card");
    const cardName = (await resolveCardName(db, cardInput)) || cardInput;
    return startCardInfoByName(interaction, db, cardName, false);
  }
};
