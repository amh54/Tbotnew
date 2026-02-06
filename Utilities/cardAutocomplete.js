const cardQuery = `
  SELECT card_name as name, aliases FROM guardiancards UNION ALL
  SELECT card_name as name, aliases FROM guardiantricks UNION ALL
  SELECT card_name as name, aliases FROM kabloomcards UNION ALL
  SELECT card_name as name, aliases FROM kabloomtricks UNION ALL
  SELECT card_name as name, aliases FROM megagrowcards UNION ALL
  SELECT card_name as name, aliases FROM megagrowtricks UNION ALL
  SELECT card_name as name, aliases FROM smartycards UNION ALL
  SELECT card_name as name, aliases FROM smartytricks UNION ALL
  SELECT card_name as name, aliases FROM solarcards UNION ALL
  SELECT card_name as name, aliases FROM solartricks UNION ALL
  SELECT card_name as name, aliases FROM beastlycards UNION ALL
  SELECT card_name as name, aliases FROM beastlytricks UNION ALL
  SELECT card_name as name, aliases FROM brainycards UNION ALL
  SELECT card_name as name, aliases FROM brainytricks UNION ALL
  SELECT card_name as name, aliases FROM crazycards UNION ALL
  SELECT card_name as name, aliases FROM crazytricks UNION ALL
  SELECT card_name as name, aliases FROM heartycards UNION ALL
  SELECT card_name as name, aliases FROM heartytricks UNION ALL
  SELECT card_name as name, aliases FROM sneakycards UNION ALL
  SELECT card_name as name, aliases FROM sneakytricks
`;

const normalize = (value) => (value || "")
  .toString()
  .toLowerCase()
  .replaceAll(/[^a-z0-9]/g, "");

const isAbbrevAlias = (alias) => /^[a-z]{1,3}\d{1,2}$/i.test(alias);

function buildAliasEntries(rows, { abbreviatedOnly } = {}) {
  const entries = [];
  for (const row of rows || []) {
    const name = row.name;
    if (!name) continue;

    const aliasField = row.aliases || "";
    if (typeof aliasField !== "string") continue;
    const aliases = aliasField
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);

    for (const alias of aliases) {
      if (abbreviatedOnly && !isAbbrevAlias(alias)) continue;
      entries.push({
        label: `${alias} (${name})`,
        value: name,
        key: normalize(alias)
      });
    }
  }
  return entries;
}

function buildNameEntries(rows) {
  const entries = [];
  for (const row of rows || []) {
    const name = row.name;
    if (!name) continue;
    entries.push({ label: name, value: name, key: normalize(name) });
  }
  return entries;
}

async function getCardAutocompleteResults(db, focusedValue) {
  const [rows] = await db.query(cardQuery);
  const nameEntries = buildNameEntries(rows);
  const search = normalize(focusedValue);

  const entries = search.length
    ? [...nameEntries, ...buildAliasEntries(rows, { abbreviatedOnly: true })]
    : nameEntries;

  const sorted = entries.toSorted((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

  const filtered = search
    ? sorted.filter((entry) => entry.key.startsWith(search)).slice(0, 25)
    : sorted.slice(0, 25);

  return filtered.map((entry) => ({ name: entry.label, value: entry.value }));
}

async function resolveCardName(db, input) {
  const [rows] = await db.query(cardQuery);
  const entries = buildAliasEntries(rows);
  const search = normalize(input);
  const match = entries.find((entry) => entry.key === search);
  return match ? match.value : null;
}

module.exports = { getCardAutocompleteResults, resolveCardName };
