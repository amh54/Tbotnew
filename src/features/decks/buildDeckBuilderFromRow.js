const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

/**
 * @description Builds a deckbuilder embed with dynamic select menu
 * @param {Object} deckbuilderRow - The deckbuilder row from database
 * @param {Array} allDecks - All decks for this deckbuilder
 * @param {Object} client - Discord client
 * @returns {Object} - Object containing embed, select menu, and processed data
 */
function buildDeckBuilderFromRow(deckbuilderRow, allDecks, client) {
  const name = deckbuilderRow.deckbuilder_name;
  const color = deckbuilderRow.color || "#FFC0CB";
  const userId = deckbuilderRow.userID;
  
  // Get user info for thumbnail - make it async safe
  let thumb = null;
  try {
    if (userId && client.users.cache.has(userId)) {
      const user = client.users.cache.get(userId);
      thumb = user.displayAvatarURL();
    }
  } catch (error) {
    console.error("Error fetching user for deckbuilder thumbnail:", error);
    // Use default avatar or leave null
    thumb = null;
  }

  // Normalize decks and categorize them
  const normalized = allDecks.map((r) => {
    const rawType = (r.type || "").toString();
    const rawArch = (r.archetype || "").toString();
    const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    return {
      id: r.deckID ?? null,
      name: r.name ?? r.deckID ?? "Unnamed",
      type: rawType,
      archetype: rawArch,
      cost: r.cost ?? r.deckcost ?? "",
      typeNorm: normalize(rawType),
      archetypeNorm: normalize(rawArch),
      description: r.description ?? "",
      image: r.image ?? null,
      creator: r.creator ?? "",
      hero: r.hero || "Unknown",
      table: r.table || "",
      raw: r,
    };
  });

  // Group decks by categories dynamically
  const availableCategories = ["all"];
  const deckLists = { all: normalized };

  const categoryChecks = [
    { key: "budget", check: (deck) => deck.typeNorm.includes("budget") },
    { key: "comp", check: (deck) => deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp") },
    { key: "ladder", check: (deck) => deck.typeNorm.includes("ladder") },
    { key: "meme", check: (deck) => deck.typeNorm.includes("meme") },
    { key: "aggro", check: (deck) => deck.archetypeNorm.includes("aggro") },
    { key: "combo", check: (deck) => deck.archetypeNorm.includes("combo") },
    { key: "control", check: (deck) => deck.archetypeNorm.includes("control") },
    { key: "midrange", check: (deck) => deck.archetypeNorm.includes("midrange") },
    { key: "tempo", check: (deck) => deck.archetypeNorm.includes("tempo") }
  ];

  for (const { key, check } of categoryChecks) {
    const filtered = normalized.filter(check);
    if (filtered.length > 0) {
      availableCategories.push(key);
      deckLists[key] = filtered;
    }
  }

  // Sort all deck lists
  for (const [key, deckList] of Object.entries(deckLists)) {
    deckLists[key] = deckList.toSorted((a, b) => 
      a.hero.localeCompare(b.hero, undefined, { sensitivity: "base" }) ||
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
  }

  // Create select menu options only for categories with decks
  const selectOptions = [];
  const categoryLabels = {
        budget: { label: "Budget Decks", emoji: "💰", desc: "Decks that are cheap for new players" },
        comp: { label: "Competitive Decks", emoji: "🏆", desc: "Some of the best decks in the game" },
        ladder: { label: "Ladder Decks", emoji: "🪜", desc: "Decks that are mostly only good for ranked games" },
        meme: { label: "Meme Decks",  emoji: "😂", desc: "Decks built for fun/weird combos" },
        aggro: { label: "Aggro Decks", emoji: "⚡", desc: "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7." },
        combo: { label: "Combo Decks",  emoji: "🧩", desc: "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)." },
        control: { label: "Control Decks",  emoji: "🛡️", desc: 'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.' },
        midrange: { label: "Midrange Decks",  emoji: "⚖️", desc: "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game" },
        tempo: { label: "Tempo Decks",  emoji: "🏃‍♂️", desc: "Focuses on slowly building a big board, winning trades and overwhelming the opponent." }
      };

  // Add category options that have decks (skip "all" initially)
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

  // Always add "All" option at the end
  selectOptions.push(
    new StringSelectMenuOptionBuilder()
      .setLabel(`All Decks (${normalized.length})`)
      .setValue("all")
      .setEmoji("📋")
      .setDescription(`View all ${name}'s decks`)
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(`deckbuildercat_${name.toLowerCase().replaceAll(/\s+/g, "_")}`)
    .setPlaceholder(`Select a category to view ${name}'s decks`)
    .addOptions(selectOptions);

  const embed = new EmbedBuilder()
    .setTitle(`${name}'s Decks`)
    .setDescription([
      `To view ${name}'s decks please select an option from the select menu below!`,
      "",
      `Note: ${name} has ${normalized.length} total decks in Tbot`
    ].join("\n"))
    .setColor(color)
    .setThumbnail(thumb);

  return {
    embed,
    select,
    deckLists,
    availableCategories,
    deckbuilderName: name,
    color,
    userId
  };
}

module.exports = buildDeckBuilderFromRow;
