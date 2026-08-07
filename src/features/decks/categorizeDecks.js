function categorizeDecks(allDecks) {
  const availableCategories = ["all"];

  const deckLists = {
    all: allDecks,
  };

  const categoryChecks = [
    {
      key: "budget",
      check: (deck) => deck.categoryNorm.includes("budget"),
    },
    {
      key: "competitive",
      check: (deck) =>
        deck.categoryNorm.includes("competitive") ||
        deck.categoryNorm.includes("comp"),
    },
    {
      key: "ladder",
      check: (deck) => deck.categoryNorm.includes("ladder"),
    },
    {
      key: "meme",
      check: (deck) => deck.categoryNorm.includes("meme"),
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
    const filtered = allDecks.filter(check);

    if (filtered.length > 0) {
      availableCategories.push(key);
      deckLists[key] = filtered;
    }
  }

  for (const [key, list] of Object.entries(deckLists)) {
    deckLists[key] = list.toSorted(
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

  return {
    availableCategories,
    deckLists,
  };
}

module.exports = categorizeDecks;
