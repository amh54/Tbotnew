function categorizeDecks(allDecks) {
  const availableCategories = ["all"];
  const deckLists = { all: allDecks };

  const categoryChecks = [
    { key: "budget", check: (deck) => deck.typeNorm.includes("budget") },
    { key: "competitive", check: (deck) => deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp") },
    { key: "ladder", check: (deck) => deck.typeNorm.includes("ladder") },
    { key: "meme", check: (deck) => deck.typeNorm.includes("meme") },
    { key: "aggro", check: (deck) => deck.archetypeNorm.includes("aggro") },
    { key: "combo", check: (deck) => deck.archetypeNorm.includes("combo") },
    { key: "control", check: (deck) => deck.archetypeNorm.includes("control") },
    { key: "midrange", check: (deck) => deck.archetypeNorm.includes("midrange") },
    { key: "tempo", check: (deck) => deck.archetypeNorm.includes("tempo") }
  ];

  for (const { key, check } of categoryChecks) {
    const filtered = allDecks.filter(check);
    if (filtered.length > 0) {
      availableCategories.push(key);
      deckLists[key] = filtered;
    }
  }

  // Sort all deck lists by hero and name
  for (const [key, deckList] of Object.entries(deckLists)) {
    deckLists[key] = deckList.toSorted((a, b) =>
      a.hero.localeCompare(b.hero, undefined, { sensitivity: "base" }) ||
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
  }

  return { availableCategories, deckLists };
}

module.exports = categorizeDecks;
