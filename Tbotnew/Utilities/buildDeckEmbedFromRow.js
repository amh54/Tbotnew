const { EmbedBuilder } = require("discord.js");
/**
 * @description Builds a Discord embed for a deck from a database row
 * @param {Object} row - The database row object
 * @param {string} tableName - The name of the database table (for color coding)
 * @param {Object} dbTableColors - Color mapping for tables
 * @returns {EmbedBuilder} - The constructed embed
 */
function buildDeckEmbedFromRow(row, tableName = null, dbTableColors = {}) {
  const color =
    tableName && dbTableColors[tableName] ? dbTableColors[tableName] : "Random";
  const embed = new EmbedBuilder().setTitle(
    row.name || row.title || "Deck"
  );

  if (row.description && row.description.trim().length > 0) {
    embed.setDescription(row.description);
  }
  if (row.creator) {
    embed.setFooter({ text: row.creator });
  }
  embed.addFields(
      {
        name: "Deck Type",
        value: `**__${row.type}__**`,
        inline: true,
      },
      {
        name: "Archetype",
        value: `**__${row.archetype}__**`,
        inline: true,
      },
      {
        name: "Deck Cost",
        value: (`${row.cost} <:spar:1057791557387956274>`).toString(),
        inline: true,
      }
    )
    .setColor(color);
  if (
    row.image &&
    typeof row.image === "string" &&
    row.image.startsWith("http")
  )
    embed.setImage(row.image);
  return embed;
}
module.exports = buildDeckEmbedFromRow;