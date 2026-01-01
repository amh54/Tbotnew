const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function createHeroEmbed(row) {
  const embed = new EmbedBuilder()
    .setThumbnail(row.thumbnail)
    .setTitle(`${row.title}`)
    .setDescription(`**\\- ${row.description} -**`)
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

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`herohelp_${row.herocommand}`)
      .setLabel(`${row.heroname} Decks`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(row.hero_emoji)
  );

  return { embed, button };
}

module.exports = createHeroEmbed;