const cardQuery = `
  SELECT
    card_name AS name,
    aliases
  FROM web_cards
  WHERE card_name IS NOT NULL
    AND LOWER(COALESCE(set_rarity, '')) NOT LIKE '%hero%'
    AND LOWER(COALESCE(card_type, '')) NOT LIKE '%superpower%'`;

const normalize = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "");

const isAbbrevAlias = (alias) => /^[a-z]{1,3}\d{1,2}$/i.test(alias);

function buildAliasEntries(rows, { abbreviatedOnly = false } = {}) {
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
      if (abbreviatedOnly && !isAbbrevAlias(alias)) {
        continue;
      }

      entries.push({
        label: `${alias} (${name})`,
        value: name,
        key: normalize(alias),
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

    entries.push({
      label: name,
      value: name,
      key: normalize(name),
    });
  }

  return entries;
}

async function getCardAutocompleteResults(db, focusedValue) {
  const result = await db.query(cardQuery);
  const rows = result.rows || [];

  const nameEntries = buildNameEntries(rows);
  const search = normalize(focusedValue);

  const entries = search.length
    ? [
        ...nameEntries,
        ...buildAliasEntries(rows, {
          abbreviatedOnly: true,
        }),
      ]
    : nameEntries;

  const sorted = entries.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, {
      sensitivity: "base",
    }),
  );

  const filtered = search
    ? sorted.filter((entry) => entry.key.startsWith(search)).slice(0, 25)
    : sorted.slice(0, 25);

  return filtered.map((entry) => ({
    name: entry.label,
    value: entry.value,
  }));
}

async function resolveCardName(db, input) {
  const result = await db.query(cardQuery);
  const rows = result.rows || [];

  const entries = [...buildAliasEntries(rows), ...buildNameEntries(rows)];

  const search = normalize(input);

  const match = entries.find((entry) => entry.key === search);

  return match ? match.value : null;
}

module.exports = {
  getCardAutocompleteResults,
  resolveCardName,
};
