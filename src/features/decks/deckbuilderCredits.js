function normalizeCreditName(value) {
  const cleaned = (value || "")
    .toString()
    .trim()
    .replaceAll(/^by\s+/gi, "")
    .replaceAll(/\?+$/g, "")
    .trim();

  if (!cleaned) return "";
  return cleaned;
}

function comparableName(value) {
  return normalizeCreditName(value).replaceAll(/\s+/g, "").toLowerCase();
}

function stripNonOwnerClauses(value) {
  return (value || "")
    .toString()
    .replaceAll(/\binspired\s+by\b.*$/gi, "")
    .replaceAll(/\bsuggested\s+on\b.*$/gi, "")
    .trim();
}

function splitCreditNames(value) {
  const cleaned = stripNonOwnerClauses(value);
  if (!cleaned) return [];

  const phraseMatch = cleaned.match(
    /^(.*?)(?:\boptimized\s+by\b|\bmodified\s+by\b|\bredefined\s+by\b)[:\s]+(.+)$/i
  );
  if (phraseMatch) {
    return [phraseMatch[1], phraseMatch[2]].flatMap(splitCreditNames);
  }

  return cleaned
    .replaceAll(/\s+(and|&)\s+/gi, ",")
    .replaceAll("/", ",")
    .split(",")
    .map(normalizeCreditName)
    .filter(Boolean);
}

function extractDeckbuilderNames(creator) {
  if (!creator) return [];

  const names = [];
  for (const line of creator.toString().split("\n")) {
    if (/^\s*inspired by\b/i.test(line)) continue;

    const createdMatch = line.match(/^\s*Created by\s+(.+?)$/i);
    const optimizedMatch = line.match(/\b(?:optimized|modified|redefined)\s+by[:\s]+(.+?)$/i);

    if (createdMatch) {
      names.push(...splitCreditNames(createdMatch[1]));
    }

    if (optimizedMatch) {
      names.push(...splitCreditNames(optimizedMatch[1]));
    }
  }

  return [...new Set(names)];
}

function getDeckbuilderSearchNames(deckbuilder) {
  const name = typeof deckbuilder === "string" ? deckbuilder : deckbuilder?.deckbuilder_name;
  const aliases = typeof deckbuilder === "string" ? "" : deckbuilder?.aliases;

  return [name, ...(aliases || "").toString().split(",")]
    .map((value) => value.trim())
    .filter(Boolean);
}

function deckMatchesDeckbuilder(creator, deckbuilder) {
  const targets = new Set(getDeckbuilderSearchNames(deckbuilder).map(comparableName).filter(Boolean));
  if (targets.size === 0) return false;

  return extractDeckbuilderNames(creator).some((name) => targets.has(comparableName(name)));
}

async function resolveDeckbuilderNames(db, creator) {
  const credits = extractDeckbuilderNames(creator);
  if (credits.length === 0 || !db) return [];

  const [rows] = await db.query("SELECT deckbuilder_name, aliases FROM deckbuilders");
  return rows
    .filter((row) => credits.some((credit) => deckMatchesDeckbuilder(`Created by ${credit}`, row)))
    .map((row) => row.deckbuilder_name);
}

module.exports = {
  deckMatchesDeckbuilder,
  extractDeckbuilderNames,
  getDeckbuilderSearchNames,
  resolveDeckbuilderNames
};
