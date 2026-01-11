const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const buildCardEmbedFromRow = require("./buildCardEmbedFromRow");
/**
 * Handles cards with stats and two buttons (stats, button, button2)
 */
async function handleCardsWithTwoButtons(row, message, tableConfig, dbTableColors) {
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cardinfo_${row.button}`)
      .setLabel(row.button)
      .setEmoji(row.button_emoji)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`cardinfo_${row.button2}`)
      .setLabel(row.button2)
      .setEmoji(row.button_emoji2)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`detectdecks_${row.card_name}`)
      .setLabel(`Detect ${row.card_name} Decks`)
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Secondary)
  );
  
  const embed = buildCardEmbedFromRow(row, tableConfig.table, dbTableColors);
  await message.channel.send({ embeds: [embed], components: [actionRow] });
}

module.exports = handleCardsWithTwoButtons;