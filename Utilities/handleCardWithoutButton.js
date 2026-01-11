const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const buildCardEmbedFromRow = require("./buildCardEmbedFromRow");

/**
 * Handles cards with stats but no button info
 */
async function handleCardWithoutButton(row, message, tableConfig, dbTableColors) {
  const embed = buildCardEmbedFromRow(row, tableConfig.table, dbTableColors);
  const detectDecks = new ButtonBuilder()
    .setCustomId(`detectdecks_${row.card_name}`)
    .setLabel(`Detect ${row.card_name} Decks`)
    .setEmoji("🔍")
    .setStyle(ButtonStyle.Secondary);
  const components = [new ActionRowBuilder().addComponents(detectDecks)];
  await message.channel.send({ embeds: [embed], components });
}

module.exports = handleCardWithoutButton;
