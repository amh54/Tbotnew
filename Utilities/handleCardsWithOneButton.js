const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const buildCardEmbedFromRow = require("./buildCardEmbedFromRow");
/**
 * Handles cards with stats and one button (stats and button, but no button2)
 */
async function handleCardsWithOneButton(row, message, tableConfig, dbTableColors) {
  const embed = buildCardEmbedFromRow(row, tableConfig.table, dbTableColors);
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cardinfo_${row.button}`)
      .setLabel(row.button)
      .setEmoji(row.button_emoji)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`detectdecks_${row.card_name}`)
      .setLabel(`Detect ${row.card_name} Decks`)
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Secondary)
  );
  
  console.log(`[DB Command] Sending card with button for: ${row.card_name}`);
  await message.channel.send({ embeds: [embed], components: [actionRow] });
  console.log(`[DB Command] Message sent successfully`);
}

module.exports = handleCardsWithOneButton;