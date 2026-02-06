const { SlashCommandBuilder } = require("discord.js");
const createHeroEmbedWithButton = require("../../Utilities/createHeroEmbedWithButton.js");
const {
  getHeroAutocompleteResults,
  resolveHeroName
} = require("../../Utilities/heroAutocomplete.js");

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
      const db = require("../../index.js");
      const focusedValue = interaction.options.getFocused();
      const results = await getHeroAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    const db = require("../../index.js");
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
          ephemeral: true
        });
      }

      const { embed, button } = await createHeroEmbedWithButton(rows[0]);
      return interaction.reply({ embeds: [embed], components: [button] });
    } catch (error) {
      console.error("Error in heroname command:", error);
      return interaction.reply({
        content: "An error occurred while fetching hero information.",
        ephemeral: true
      });
    }
  }
};
