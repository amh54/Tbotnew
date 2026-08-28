const normalize = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function buildAliasEntries(rows) {
  const entries = [];

  for (const row of rows || []) {
    const heroName = row.heroname;

    if (!heroName) continue;

    entries.push({
      label: heroName,
      value: heroName,
      key: normalize(heroName),
    });

    const aliasField = row.aliases || "";

    if (typeof aliasField !== "string") continue;

    const aliases = aliasField
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);

    for (const alias of aliases) {
      entries.push({
        label: `${alias} (${heroName})`,
        value: heroName,
        key: normalize(alias),
      });
    }
  }

  return entries;
}

function buildNameEntries(rows) {
  const entries = [];

  for (const row of rows || []) {
    const heroName = row.heroname;

    if (!heroName) continue;

    entries.push({
      label: heroName,
      value: heroName,
      key: normalize(heroName),
    });
  }

  return entries;
}

async function getHeroAutocompleteResults(pool, focusedValue) {
  const result = await pool.query("SELECT heroname, aliases FROM herocommands");

  const entries = buildNameEntries(result.rows);
  const search = normalize(focusedValue);

  const filtered = search
    ? entries.filter((entry) => entry.key.startsWith(search)).slice(0, 25)
    : entries.slice(0, 25);

  return filtered.map((entry) => ({
    name: entry.label,
    value: entry.value,
  }));
}

async function resolveHeroName(pool, input) {
  const result = await pool.query("SELECT heroname, aliases FROM herocommands");

  const entries = buildAliasEntries(result.rows);
  const search = normalize(input);

  const match = entries.find((entry) => entry.key === search);

  return match ? match.value : null;
}

module.exports = {
  getHeroAutocompleteResults,
  resolveHeroName,
};
