const dbTables = [
  { table: "gsdecks", hero: "Green Shadow" },
  { table: "sfdecks", hero: "Solar Flare" },
  { table: "wkdecks", hero: "Wall Knight" },
  { table: "czdecks", hero: "Chompzilla" },
  { table: "spdecks", hero: "Spudow" },
  { table: "ctdecks", hero: "Citron" },
  { table: "gkdecks", hero: "Grass Knuckles" },
  { table: "ncdecks", hero: "Night Cap" },
  { table: "rodecks", hero: "Rose" },
  { table: "ccdecks", hero: "Captain Combustible" },
  { table: "bcdecks", hero: "Beta Carrotina" },
  { table: "sbdecks", hero: "Super Brainz" },
  { table: "smdecks", hero: "The Smash" },
  { table: "ifdecks", hero: "Impfinity" },
  { table: "rbdecks", hero: "Rustbolt" },
  { table: "ebdecks", hero: "Electric Boogaloo" },
  { table: "bfdecks", hero: "Brain Freeze" },
  { table: "pbdecks", hero: "Professor Brainstorm" },
  { table: "imdecks", hero: "Immorticia" },
  { table: "zmdecks", hero: "Z-Mech" },
  { table: "ntdecks", hero: "Neptuna" },
  { table: "hgdecks", hero: "Huge-Gigantacus" }
];

function normalizeCardName(cardName) {
  return cardName.toString().trim().toLowerCase();
}

function parseCardsList(row) {
  return (row.cards || "")
    .split('\n')
    .map((card) => card.trim().toLowerCase())
    .filter((card) => card.length > 0);
}

function buildDeckSummary(row, hero, table) {
  const rawType = (row.type || "").toString();
  const rawArch = (row.archetype || "").toString();
  const normalize = (value) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

  return {
    id: row.deckID ?? null,
    name: row.name ?? row.deckID ?? "Unnamed",
    type: rawType,
    archetype: rawArch,
    cost: row.cost ?? row.deckcost ?? "",
    typeNorm: normalize(rawType),
    archetypeNorm: normalize(rawArch),
    description: row.description ?? "",
    image: row.image ?? null,
    creator: row.creator ?? "",
    hero,
    table,
    raw: row,
  };
}

async function getDeckRowsForCard(db, table, cardName) {
  const [rows] = await db.query(
    `SELECT * FROM ${table} WHERE cards LIKE ?`,
    [`%${cardName}%`]
  );

  return rows.filter((row) => parseCardsList(row).includes(cardName));
}

async function collectDecksWithCard(db, cardNames) {
  const requestedCards = Array.isArray(cardNames)
    ? cardNames.filter(Boolean)
    : [cardNames].filter(Boolean);

  if (requestedCards.length === 0) {
    return [];
  }

  const normalizedCards = requestedCards.map(normalizeCardName);
  const allDecks = [];

  for (const { table, hero } of dbTables) {
    try {
      const matchedRows = new Map();

      for (const cardName of normalizedCards) {
        const rows = await getDeckRowsForCard(db, table, cardName);

        for (const row of rows) {
          const rowKey = row.deckID ?? row.name ?? JSON.stringify(row);
          const existingMatch = matchedRows.get(rowKey) || { row, matchCount: 0 };
          existingMatch.matchCount += 1;
          matchedRows.set(rowKey, existingMatch);
        }
      }

      for (const { row, matchCount } of matchedRows.values()) {
        if (matchCount < normalizedCards.length) continue;
        allDecks.push(buildDeckSummary(row, hero, table));
      }
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
    }
  }

  return allDecks.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = collectDecksWithCard;
