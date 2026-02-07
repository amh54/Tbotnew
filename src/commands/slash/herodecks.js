const { SlashCommandBuilder } = require("discord.js");
const { startHeroDecksByName } = require("../../handlers/heroHandler.js");
const {
  getHeroAutocompleteResults,
  resolveHeroName
} = require("../../features/heroes/heroAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("herodecks")
    .setDescription("Browse decks for a hero")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("Hero name")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    try {
      const db = require("../../../index.js");
      const focusedValue = interaction.options.getFocused();
      const results = await getHeroAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    const db = require("../../../index.js");
    const heroInput = interaction.options.getString("hero");
    const resolved = await resolveHeroName(db, heroInput);
    return startHeroDecksByName(interaction, db, interaction.client, resolved || heroInput);
  }
};
