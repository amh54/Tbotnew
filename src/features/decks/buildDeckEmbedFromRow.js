const { EmbedBuilder } = require("discord.js");
const buildDeckFooter = require("./buildDeckFooter.js");

/**
 * Builds a Discord deck embed from a tbot_decks row.
 * The visual layout remains the same as the previous deck embeds.
 */
function buildDeckEmbedFromRow(row, tableName = null, dbTableColors = {}) {
  const color =
    dbTableColors[row.hero] ||
    (tableName && dbTableColors[tableName] ? dbTableColors[tableName] : "Random");

  const embed = new EmbedBuilder()
    .setTitle(row.name || row.title || "Deck");

  if (row.description && row.description.trim().length > 0) {
    embed.setDescription(row.description);
  }

  const footerText = buildDeckFooter(row);
  if (footerText) {
    embed.setFooter({ text: footerText });
  }

  embed
    .addFields(
      {
        name: "Category",
        value: `**__${row.category || "N/A"}__**`,
        inline: true,
      },
      {
        name: "Archetype",
        value: `**__${row.archetype || "N/A"}__**`,
        inline: true,
      },
      {
        name: "Cost",
        value: row.cost
          ? `${row.cost} <:spar:1057791557387956274>`
          : "**__N/A__**",
        inline: true,
      }
    )
    .setColor(color);

  if (
    row.image &&
    typeof row.image === "string" &&
    row.image.startsWith("http")
  ) {
    embed.setImage(row.image);
  }

  return embed;
}

module.exports = buildDeckEmbedFromRow;
