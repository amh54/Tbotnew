const { EmbedBuilder } = require("discord.js");

const buildDeckFooter = require("./buildDeckFooter.js");

function buildDeckEmbed(row, deckColor) {
  const embed = new EmbedBuilder()
    .setTitle(row.name || "Unknown")
    .setDescription(row.description || "")
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
        name: "Deck Cost",
        value: row.cost
          ? `${Number(row.cost).toLocaleString()} <:spar:1057791557387956274>`
          : "**N/A**",
        inline: true,
      },
    )
    .setColor(deckColor);

  if (row.deck_doc && typeof row.deck_doc === "string") {
    embed.addFields({
      name: "Deck Tutorial",
      value: `[deck guide](${row.deck_doc})`,
      inline: true,
    });
  }

  const footerText = buildDeckFooter(row);

  if (footerText) {
    embed.setFooter({
      text: footerText,
    });
  }

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