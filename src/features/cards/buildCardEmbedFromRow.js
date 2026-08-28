const { EmbedBuilder } = require("discord.js");

function buildCardEmbedFromRow(row, color = "Random") {
  const embed = new EmbedBuilder()
    .setTitle(row.title || row.card_name || row.cardid || "Card")
    .setColor(color);

  if (row.description && String(row.description).trim().length > 0) {
    embed.setDescription(String.raw`**\- ${row.description} -**`);
  }

  embed.addFields({
    name: "Stats",
    value: row.stats || "N/A",
    inline: true,
  });

  if (row.traits) {
    embed.addFields({
      name: "Trait",
      value: row.traits,
      inline: true,
    });
  }

  if (row.ability) {
    embed.addFields({
      name: "Ability",
      value: row.ability,
      inline: true,
    });
  }

  if (row.set_rarity) {
    embed.addFields({
      name: "Set-Rarity",
      value: `**${row.set_rarity}**`,
      inline: true,
    });
  }

  if (row.flavor_text) {
    embed.addFields({
      name: "Flavor Text",
      value: row.flavor_text,
      inline: true,
    });
  }

  if (
    row.thumbnail &&
    typeof row.thumbnail === "string" &&
    row.thumbnail.startsWith("http")
  ) {
    embed.setThumbnail(row.thumbnail);
  }

  return embed;
}

module.exports = buildCardEmbedFromRow;
