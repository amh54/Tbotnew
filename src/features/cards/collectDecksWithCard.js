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

async function collectDecksWithCard(db, cardName) {
  const allDecks = [];

  for (const { table, hero } of dbTables) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE cards LIKE ?`,
        [`%${cardName}%`]
      );

      for (const row of rows) {
        const cardsList = (row.cards || "")
          .split('\n')
          .map(c => c.trim().toLowerCase())
          .filter(c => c.length > 0);

        const searchName = cardName.toLowerCase().trim();
        if (!cardsList.includes(searchName)) continue;

        const rawType = (row.type || "").toString();
        const rawArch = (row.archetype || "").toString();
        const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

        allDecks.push({
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
          hero: hero,
          table: table,
          raw: row,
        });
      }
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
    }
  }

  return allDecks.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = collectDecksWithCard;
