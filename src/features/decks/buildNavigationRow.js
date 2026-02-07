const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function buildNavigationRow(category, prevIndex, nextIndex, customIdPrefix = "nav", backPrefix = "back") {
  const navRow = new ActionRowBuilder();

  if (prevIndex === 'list') {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${backPrefix}_${category}`)
        .setEmoji("📋")
        .setLabel("Back to List")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_${category}_${prevIndex}`)
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (nextIndex === 'list') {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${backPrefix}_${category}`)
        .setEmoji("📋")
        .setLabel("Back to List")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_${category}_${nextIndex}`)
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return navRow;
}

module.exports = buildNavigationRow;
