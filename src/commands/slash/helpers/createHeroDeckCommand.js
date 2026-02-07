const { SlashCommandBuilder } = require("discord.js");
const buildDeckEmbedFromRow = require("../../../features/decks/buildDeckEmbedFromRow.js");
const dbTableColors = require("../../../lib/db/dbTableColors.js");
const {
  getHeroDeckAutocompleteResults,
  resolveHeroDeckName
} = require("../../../features/decks/deckAutocomplete.js");

const normalizeDeckInput = (value) => (value || "")
  .toString()
  .toLowerCase()
  .replaceAll(/\s+/g, "");

function createHeroDeckCommand({ commandName, heroName, description }) {
  return {
    data: new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(description || `View ${heroName} decks`)
      .addStringOption((option) =>
        option
          .setName("deck")
          .setDescription(`Deck name for ${heroName}`)
          .setRequired(true)
          .setAutocomplete(true)
      ),
    async autocomplete(interaction) {
      try {
        const db = require("../../../../index.js");
        const focusedValue = interaction.options.getFocused();
        const results = await getHeroDeckAutocompleteResults(db, commandName, focusedValue);
        await interaction.respond(results);
      } catch (error) {
        console.error("Autocomplete error:", error);
        await interaction.respond([]);
      }
    },
    async execute(interaction) {
      const db = require("../../../../index.js");
      const deckInput = interaction.options.getString("deck");
      const resolved = await resolveHeroDeckName(db, commandName, deckInput);
      const deckName = resolved || deckInput;

      const [rows] = await db.query(
        `SELECT * FROM ${commandName} WHERE name = ? LIMIT 1`,
        [deckName]
      );

      if (!rows || rows.length === 0) {
        const normalized = normalizeDeckInput(deckInput);
        const [fallbackRows] = await db.query(
          `SELECT * FROM ${commandName} WHERE LOWER(REPLACE(name, ' ', '')) = ? LIMIT 1`,
          [normalized]
        );

        if (!fallbackRows || fallbackRows.length === 0) {
          return interaction.reply({
            content: `No ${heroName} deck found for "${deckInput}".`
          });
        }

        const embed = buildDeckEmbedFromRow(fallbackRows[0], commandName, dbTableColors);
        return interaction.reply({ embeds: [embed] });
      }

      const embed = buildDeckEmbedFromRow(rows[0], commandName, dbTableColors);
      return interaction.reply({ embeds: [embed] });
    }
  };
}

module.exports = createHeroDeckCommand;
