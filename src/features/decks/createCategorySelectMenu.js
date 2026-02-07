const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

function createCategorySelectMenu(cardName, availableCategories, deckLists) {
  const categoryLabels = {
    budget: { label: "Budget Decks", emoji: "💰", desc: "Decks that are cheap for new players" },
    competitive: { label: "Competitive Decks", emoji: "🏆", desc: "Some of the best decks in the game" },
    ladder: { label: "Ladder Decks", emoji: "🪜", desc: "Decks that are mostly only good for ranked games" },
    meme: { label: "Meme Decks", emoji: "😂", desc: "Decks built for fun/weird combos" },
    aggro: { label: "Aggro Decks", emoji: "⚡", desc: "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7." },
    combo: { label: "Combo Decks", emoji: "🧩", desc: "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)." },
    control: { label: "Control Decks", emoji: "🛡️", desc: 'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.' },
    midrange: { label: "Midrange Decks", emoji: "⚖️", desc: "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game" },
    tempo: { label: "Tempo Decks", emoji: "🏃‍♂️", desc: "Focuses on slowly building a big board, winning trades and overwhelming the opponent." }
  };

  const selectOptions = [];

  for (const cat of availableCategories.slice(1)) {
    const config = categoryLabels[cat];
    if (config && deckLists[cat].length > 0) {
      selectOptions.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${config.label} (${deckLists[cat].length})`)
          .setValue(cat)
          .setDescription(config.desc)
          .setEmoji(config.emoji)
      );
    }
  }

  selectOptions.push(
    new StringSelectMenuOptionBuilder()
      .setLabel(`All Decks (${deckLists.all.length})`)
      .setValue("all")
      .setEmoji("📋")
      .setDescription(`View all decks containing "${cardName}"`)
  );

  return new StringSelectMenuBuilder()
    .setCustomId(`deckcat_${cardName}`)
    .setPlaceholder(`Select a category to view decks containing "${cardName}"`)
    .addOptions(selectOptions);
}

module.exports = createCategorySelectMenu;
