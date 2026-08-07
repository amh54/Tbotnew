const { getHeroConfig } = require("../heroes/heroDeckConfig.js");

const normalize = (value) => (value || "")
  .toString()
  .toLowerCase()
  .replaceAll(/[^a-z0-9]/g, "");

function buildAliasEntries(rows) {
  const entries = [];
  for (const row of rows || []) {
    const name = row.name;
    if (!name) continue;

    entries.push({ label: name, value: name, key: normalize(name) });

    const aliasField = row.aliases || "";
    if (typeof aliasField !== "string") continue;

    const aliases = aliasField
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);

    for (const alias of aliases) {
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
  return (rows || [])
    .filter((row) => row.name)
    .map((row) => ({
      label: row.name,
      value: row.name,
      key: normalize(row.name)
    }));
}

async function getHeroDeckAutocompleteResults(db, commandName, focusedValue) {
  const config = getHeroConfig(commandName);
  if (!config) return [];

  const [rows] = await db.query(
    `SELECT name, aliases
     FROM tbot_decks
     WHERE LOWER(side) = LOWER(?)
       AND LOWER(hero) = LOWER(?)
     ORDER BY name COLLATE utf8mb4_general_ci ASC`,
    [config.side, config.hero]
  );

  const entries = buildNameEntries(rows);
  const search = normalize(focusedValue);
  const filtered = search
    ? entries.filter((entry) => entry.key.startsWith(search)).slice(0, 25)
    : entries.slice(0, 25);

  return filtered.map((entry) => ({ name: entry.label, value: entry.value }));
}

async function resolveHeroDeckName(db, commandName, input) {
  const config = getHeroConfig(commandName);
  if (!config) return null;

  const [rows] = await db.query(
    `SELECT name, aliases
     FROM tbot_decks
     WHERE LOWER(side) = LOWER(?)
       AND LOWER(hero) = LOWER(?)`,
    [config.side, config.hero]
  );

  const entries = buildAliasEntries(rows);
  const search = normalize(input);
  const match = entries.find((entry) => entry.key === search);
  return match ? match.value : null;
}

module.exports = {
  getHeroDeckAutocompleteResults,
  resolveHeroDeckName
};
