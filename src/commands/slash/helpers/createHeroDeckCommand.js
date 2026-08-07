const { SlashCommandBuilder } = require("discord.js");
const buildDeckEmbedFromRow = require("../../../features/decks/buildDeckEmbedFromRow.js");
const dbTableColors = require("../../../lib/db/dbTableColors.js");
const {
  getHeroDeckAutocompleteResults,
  resolveHeroDeckName
} = require("../../../features/decks/deckAutocomplete.js");
const { getHeroConfig } = require("../../../features/heroes/heroDeckConfig.js");

const normalizeDeckInput = (value) => (value || "")
  .toString()
  .toLowerCase()
  .replaceAll(/\s+/g, "");

function createHeroDeckCommand({ commandName, heroName, description }) {
  const config = getHeroConfig(commandName) || getHeroConfig(heroName);
  const actualHeroName = config?.hero || heroName;

  return {
    data: new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(description || `View ${actualHeroName} decks`)
      .addStringOption((option) =>
        option
          .setName("deck")
          .setDescription(`Deck name for ${actualHeroName}`)
          .setRequired(true)
          .setAutocomplete(true)
      ),

    async autocomplete(interaction) {
      try {
        const db = require("../../../../index.js");
        const focusedValue = interaction.options.getFocused();
        const results = await getHeroDeckAutocompleteResults(
          db,
          commandName,
          focusedValue
        );
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

      const heroConfig = getHeroConfig(commandName);
      if (!heroConfig) {
        return interaction.reply({
          content: "Hero configuration not found."
        });
      }

      let [rows] = await db.query(
        `SELECT *
         FROM tbot_decks
         WHERE LOWER(side) = LOWER(?)
           AND LOWER(hero) = LOWER(?)
           AND name = ?
         LIMIT 1`,
        [heroConfig.side, heroConfig.hero, deckName]
      );

      if (!rows || rows.length === 0) {
        const normalized = normalizeDeckInput(deckInput);
        [rows] = await db.query(
          `SELECT *
           FROM tbot_decks
           WHERE LOWER(side) = LOWER(?)
             AND LOWER(hero) = LOWER(?)
             AND LOWER(REPLACE(name, ' ', '')) = ?
           LIMIT 1`,
          [heroConfig.side, heroConfig.hero, normalized]
        );
      }

      if (!rows || rows.length === 0) {
        return interaction.reply({
          content: `No ${actualHeroName} deck found for "${deckInput}".`
        });
      }

      const embed = buildDeckEmbedFromRow(
        rows[0],
        "tbot_decks",
        dbTableColors
      );

      return interaction.reply({ embeds: [embed] });
    }
  };
}

module.exports = createHeroDeckCommand;
