function normalizeCardName(cardName) {
  return cardName
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^\d+x\s*/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseCardsList(row) {
  return (row.cards || "")
    .split("\n")
    .map(normalizeCardName)
    .filter(Boolean);
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildDeckSummary(row) {
  const rawCategory = (row.category || "").toString();

  const rawArchetype = (row.archetype || "").toString();

  return {
    id: row.deckID ?? null,

    name: row.name ?? row.deckID ?? "Unnamed",

    category: rawCategory,

    archetype: rawArchetype,

    cost: row.cost ?? "",

    categoryNorm: normalize(rawCategory),

    archetypeNorm: normalize(rawArchetype),

    description: row.description ?? "",

    image: row.image ?? null,

    creator: row.creator ?? "",

    inspiration: row.inspiration ?? "",

    optimization: row.optimization ?? "",

    suggested_date: row.suggested_date ?? "",

    updated_date: row.updated_date ?? "",

    hero: row.hero ?? "",

    side: row.side ?? "",

    table: "tbot_decks",

    raw: row,
  };
}

async function getDeckRowsForCard(db, cardSearch, cardKey) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM tbot_decks
    WHERE LOWER(cards) LIKE ?
    `,
    [`%${cardSearch.toLowerCase()}%`],
  );

  return rows.filter((row) => parseCardsList(row).includes(cardKey));
}

async function collectDecksWithCard(db, cardNames) {
  const requestedCards = Array.isArray(cardNames)
    ? cardNames.filter(Boolean)
    : [cardNames].filter(Boolean);

  if (requestedCards.length === 0) {
    return [];
  }

  const matchedDecks = new Map();

  for (const cardName of requestedCards) {
    const cardKey = normalizeCardName(cardName);
    const rows = await getDeckRowsForCard(db, cardName.toString().trim(), cardKey);

    for (const row of rows) {
      const key = row.deckID ?? row.name ?? JSON.stringify(row);

      const entry = matchedDecks.get(key) || {
        row,
        matchCount: 0,
      };

      entry.matchCount += 1;

      matchedDecks.set(key, entry);
    }
  }

  return [...matchedDecks.values()]
    .filter(({ matchCount }) => matchCount >= requestedCards.length)
    .map(({ row }) => buildDeckSummary(row))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      }),
    );
}

module.exports = collectDecksWithCard;
