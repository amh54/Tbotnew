const { SlashCommandBuilder } = require("discord.js");
const { startDetectDecksByName } = require("../../handlers/detectDecksHandler.js");
const {
  getCardAutocompleteResults,
  resolveCardName
} = require("../../features/cards/cardAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cardsearch")
    .setDescription("Find decks that contain one or more specific cards")
    .addStringOption((option) =>
      option
        .setName("card")
        .setDescription("Primary card name")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("card2")
        .setDescription("Optional second card name")
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("card3")
        .setDescription("Optional third card name")
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
    const requestedCards = [
      interaction.options.getString("card"),
      interaction.options.getString("card2"),
      interaction.options.getString("card3")
    ].filter(Boolean);

    const resolvedCards = await Promise.all(
      requestedCards.map(async (cardInput) => (await resolveCardName(db, cardInput)) || cardInput)
    );

    return startDetectDecksByName(interaction, db, resolvedCards);
  }
};
