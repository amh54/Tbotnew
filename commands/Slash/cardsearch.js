const { SlashCommandBuilder } = require("discord.js");
const { startDetectDecksByName } = require("../../Events/handlers/detectDecksHandler.js");
const {
  getCardAutocompleteResults,
  resolveCardName
} = require("../../Utilities/cardAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cardsearch")
    .setDescription("Find decks that contain a specific card")
    .addStringOption((option) =>
      option
        .setName("card")
        .setDescription("Card name")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    try {
      const db = require("../../index.js");
      const focusedValue = interaction.options.getFocused();
      const results = await getCardAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    const db = require("../../index.js");
    const cardInput = interaction.options.getString("card");
    const cardName = (await resolveCardName(db, cardInput)) || cardInput;
    return startDetectDecksByName(interaction, db, cardName);
  }
};
