const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
/**
 * @description Builds a navigation row for a deck
 * @param {*} category The category of the deck
 * @param {*} currentIndex The current index of the deck
 * @param {*} total The total number of decks
 * @param {*} specialCategories The special categories for the deck
 * @returns {ActionRowBuilder} The constructed action row
 */
function buildNavRow(category, currentIndex, total, specialCategories) {
  const isSpecial = specialCategories.includes(category);
  const prevIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;

  let leftId =
    isSpecial && currentIndex === 0
      ? `back_to_list_${category}`
      : `nav_${category}_${prevIndex}`;
  let rightId =
    isSpecial && currentIndex === total - 1
      ? `back_to_list_${category}`
      : `nav_${category}_${nextIndex}`;

  if (leftId === rightId) {
    rightId = `${rightId}_alt`;
  }

  const left = new ButtonBuilder().setEmoji("⬅️");
  const right = new ButtonBuilder().setEmoji("➡️");

  left
    .setStyle(
      leftId.startsWith("back_to_list")
        ? ButtonStyle.Secondary
        : ButtonStyle.Primary
    )
    .setCustomId(leftId);
  right
    .setStyle(
      rightId.startsWith("back_to_list")
        ? ButtonStyle.Secondary
        : ButtonStyle.Primary
    )
    .setCustomId(rightId);

  return new ActionRowBuilder().addComponents(left, right);
}

module.exports = buildNavRow;