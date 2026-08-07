const {
  EmbedBuilder,
} = require("discord.js");
const createCategorySelectMenu = require("./createCategorySelectMenu.js");

/**
 * Builds a deckbuilder embed with dynamic select menu
 *
 * @param {Object} deckbuilderRow
 * @param {Array} allDecks
 * @param {Object} client
 * @returns {Object}
 */
function buildDeckBuilderFromRow(deckbuilderRow, allDecks, client) {
  const name = deckbuilderRow.deckbuilder_name;
  const color = deckbuilderRow.color || "#FFC0CB";
  const userId = deckbuilderRow.userID;
  let thumb = null;

  try {
    if (userId && client.users.cache.has(userId)) {
      const user = client.users.cache.get(userId);
      thumb = user.displayAvatarURL();
    }
  } catch (error) {
    console.error("Error fetching user for deckbuilder thumbnail:", error);
  }

  const normalize = (s) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalized = allDecks.map((r) => {
    const rawType = (r.type || r.category || "").toString();
    const rawArch = (r.archetype || "").toString();
    return {
      id: r.deckID ?? null,
      name: r.name ?? r.deckID ?? "Unnamed",
      type: rawType,
      category: r.category || r.type || "N/A",
      archetype: rawArch,
      cost: r.cost ?? r.deckcost ?? "",
      typeNorm: normalize(rawType),
      archetypeNorm: normalize(rawArch),
      description: r.description ?? "",
      image: r.image ?? null,
      creator: r.creator ?? "",
      inspiration: r.inspiration ?? "",
      optimization: r.optimization ?? "",
      suggested_date: r.suggested_date ?? null,
      updated_date: r.updated_date ?? null,
      hero: r.hero || "Unknown",
      table: r.table || "",
      raw: r,
    };
  });

  const availableCategories = ["all"];

  const deckLists = {
    all: normalized,
  };

  const categoryChecks = [
    {
      key: "budget",
      check: (deck) => deck.typeNorm.includes("budget"),
    },

    {
      key: "comp",
      check: (deck) =>
        deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp"),
    },

    {
      key: "ladder",
      check: (deck) => deck.typeNorm.includes("ladder"),
    },

    {
      key: "meme",
      check: (deck) => deck.typeNorm.includes("meme"),
    },

    {
      key: "aggro",
      check: (deck) => deck.archetypeNorm.includes("aggro"),
    },

    {
      key: "combo",
      check: (deck) => deck.archetypeNorm.includes("combo"),
    },

    {
      key: "control",
      check: (deck) => deck.archetypeNorm.includes("control"),
    },

    {
      key: "midrange",
      check: (deck) => deck.archetypeNorm.includes("midrange"),
    },

    {
      key: "tempo",
      check: (deck) => deck.archetypeNorm.includes("tempo"),
    },
  ];

  for (const { key, check } of categoryChecks) {
    const filtered = normalized.filter(check);

    if (filtered.length > 0) {
      availableCategories.push(key);

      deckLists[key] = filtered;
    }
  }

  for (const [key, deckList] of Object.entries(deckLists)) {
    deckLists[key] = deckList.toSorted(
      (a, b) =>
        a.hero.localeCompare(b.hero, undefined, {
          sensitivity: "base",
        }) ||
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
    );
  }

  const select = createCategorySelectMenu(name, availableCategories, deckLists, {
    customIdPrefix: "deckbuildercat",
    customIdValue: name.toLowerCase().replace(/\s+/g, "_"),
    placeholder: `Select a category to view ${name}'s decks`,
    allDecksDescription: `View all ${name}'s decks`,
  });

  const embed = new EmbedBuilder()
    .setTitle(`${name}'s Decks`)
    .setDescription(
      [
        `To view ${name}'s decks please select an option from the select menu below!`,
        "",
        `Note: ${name} has ${normalized.length} total decks in Tbot`,
      ].join("\n"),
    )
    .setColor(color)
    .setThumbnail(thumb);

  return {
    embed,
    select,
    deckLists,
    availableCategories,
    deckbuilderName: name,
    color,
    userId,
  };
}

module.exports = buildDeckBuilderFromRow;
