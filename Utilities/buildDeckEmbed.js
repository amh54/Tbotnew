const { EmbedBuilder } = require("discord.js");
/**
 * @description Builds a Discord embed for a deck from a database row
 * @param {*} row  The database row object
 * @param {*} deckColor  The color to use for the embed
 * @returns {EmbedBuilder} The constructed embed
 */
function buildDeckEmbed(row, deckColor) {
  const embed = new EmbedBuilder()
    .setTitle(row.name || "Unknown")
    .setDescription(row.description || "")
    .setFooter({ text: row.creator || "" })
    .addFields(
      {
        name: "Deck Type",
        value: `**__${row.type || "N/A"}__**`,
        inline: true,
      },
      {
        name: "Archetype",
        value: `**__${row.archetype || "N/A"}__**`,
        inline: true,
      },
      {
        name: "Deck Cost",
        value: row.cost || "**__N/A__**",
        inline: true,
      }
    )
    .setColor(deckColor);

  if (
    row.image &&
    typeof row.image === "string" &&
    row.image.startsWith("http")
  ) {
    embed.setImage(row.image);
  }
  return embed;
}

module.exports = buildDeckEmbed;