const { EmbedBuilder } = require("discord.js");

function createHeroEmbed(row) {
  const embed = new EmbedBuilder()
    .setThumbnail(row.thumbnail)
    .setTitle(`${row.title}`)
    .setDescription(String.raw`**\- ${row.description} -**`)
    .setColor(row.hero_color)
    .addFields(
      {
        name: "Superpowers",
        value: row.superpowers,
      },
      {
        name: "Set-Rarity", 
        value: row.set_rarity,
      },
      {
        name: "Flavor Text",
        value: row.flavor_text,
      }
    );

  return embed;
}

module.exports = createHeroEmbed;