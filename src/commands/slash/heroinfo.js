const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const createHeroEmbed = require("../../features/heroes/createHeroEmbed.js");
const {
  getHeroAutocompleteResults,
  resolveHeroName
} = require("../../features/heroes/heroAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("heroinfo")
    .setDescription("View hero information")
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
    const heroName = (await resolveHeroName(db, heroInput)) || heroInput;

    try {
      const [rows] = await db.query(
        "SELECT * FROM herocommands WHERE heroname = ? LIMIT 1",
        [heroName]
      );

      if (!rows || rows.length === 0) {
        return interaction.reply({
          content: "Hero Data not found in database.",
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = createHeroEmbed(rows[0]);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in heroname command:", error);
      return interaction.reply({
        content: "An error occurred while fetching hero information.",
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
