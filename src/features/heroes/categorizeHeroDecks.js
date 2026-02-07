const matchesCategory = require("../decks/matchesCategory.js");

function categorizeHeroDecks(decks, heroName, deckTable) {
  const normalized = decks.map((r) => {
    const rawType = (r.type || "").toString();
    const rawArch = (r.archetype || "").toString();
    const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    return {
      id: r.deckID ?? null,
      name: r.name ?? r.deckID ?? "Unnamed",
      type: rawType,
      archetype: rawArch,
      cost: r.cost ?? r.deckcost ?? "",
      image: r.image ?? null,
      creator: r.creator ?? "",
      typeNorm: normalize(rawType),
      archetypeNorm: normalize(rawArch),
      description: r.description ?? "",
      raw: r,
      hero: heroName,
      table: deckTable
    };
  });

  normalized.sort((a, b) => a.name.localeCompare(b.name));

  const allCategories = ["budget", "competitive", "ladder", "meme", "aggro", "combo", "control", "midrange", "tempo"];
  const availableCategories = ["all"];
  const deckLists = { all: normalized };

  for (const cat of allCategories) {
    const filtered = normalized.filter((r) => matchesCategory(r, cat));
    if (filtered.length > 0) {
      availableCategories.push(cat);
      deckLists[cat] = filtered;
    }
  }

  return { normalized, deckLists, availableCategories };
}

module.exports = categorizeHeroDecks;
