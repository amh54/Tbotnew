const mysql = require("mysql2");
const { host, user, password, database, port } = require("../config.json");

const deckTables = [
  "rbdecks",
  "zmdecks",
  "ctdecks",
  "gsdecks",
  "bcdecks",
  "bfdecks",
  "ccdecks",
  "czdecks",
  "ebdecks",
  "gkdecks",
  "hgdecks",
  "sbdecks",
  "ifdecks",
  "imdecks",
  "ncdecks",
  "ntdecks",
  "pbdecks",
  "rodecks",
  "sfdecks",
  "smdecks",
  "spdecks",
  "wkdecks"
];

function extractDeckbuilderNames(creator) {
  if (!creator) return [];
  const text = creator.toString();
  const lines = text.split("\n");
  const names = [];

  const aliasMap = new Map([
    ["igmarockers", "Igma"],
    ["pilowy", "Pillowy"],
    ["thequestionmark", "The Question Mark"],
    ["justini1212", "Justini"],
    ["stingray201", "Stingray"],
    ["snortingsalt", "Salt"],
    ["aveorni", "BADorni"],
    ["averoni", "BADorni"]
  ]);

  const normalizeName = (raw) => {
    const cleaned = raw
      .trim()
      .replaceAll(/^by\s+/gi, "")
      .replaceAll(/\?+$/g, "")
      .trim();
    if (!cleaned) return "";

    const lookupKey = cleaned.replaceAll(/\s+/g, "").toLowerCase();
    return aliasMap.get(lookupKey) || cleaned;
  };

  const normalizeAndSplitName = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    const withoutInspired = trimmed.replaceAll(/\binspired\s+by\b.*$/gi, "").trim();
    if (!withoutInspired) return [];

    const phraseMatch = withoutInspired.match(
      /^(.*?)(?:\boptimized\s+by\b|\bmodified\s+by\b|\bredefined\s+by\b)\s+(.+)$/i
    );
    if (phraseMatch) {
      const left = phraseMatch[1].trim();
      const right = phraseMatch[2].trim();
      const parts = [];
      if (left) parts.push(left);
      if (right) parts.push(right);
      return parts.flatMap(normalizeAndSplitName);
    }

    const cleaned = normalizeName(withoutInspired);
    return cleaned ? [cleaned] : [];
  };

  for (const line of lines) {
    if (/^inspired by\b/i.test(line)) {
      continue;
    }

    const createdMatch = line.match(/^Created by\s+(.+?)$/i);
    const optimizedMatch = line.match(/optimized by[:\s]+(.+?)$/i);

    if (createdMatch) {
      const creators = createdMatch[1]
        .replaceAll(/\s+(and|&)\s+/gi, ",")
        .replaceAll("/", ",")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      for (const creator of creators) {
        names.push(...normalizeAndSplitName(creator));
      }
    }

    if (optimizedMatch) {
      const optimizers = optimizedMatch[1]
        .replaceAll(/\s+(and|&)\s+/gi, ",")
        .replaceAll("/", ",")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      for (const optimizer of optimizers) {
        names.push(...normalizeAndSplitName(optimizer));
      }
    }
  }

  return [...new Set(names)];
}

async function rebuildCounts() {
  const db = mysql
    .createPool({
      host,
      user,
      password,
      database,
      port
    })
    .promise();

  const counts = new Map();

  for (const table of deckTables) {
    const [rows] = await db.query(`SELECT creator FROM \`${table}\``);
    for (const row of rows) {
      const names = extractDeckbuilderNames(row.creator);
      for (const name of names) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
  }

  await db.query("UPDATE deckbuilders SET numb_of_decks = 0");

  let updated = 0;
  let missing = 0;

  for (const [name, count] of counts.entries()) {
    const [result] = await db.query(
      "UPDATE deckbuilders SET numb_of_decks = ? WHERE deckbuilder_name = ?",
      [count, name]
    );
    if (result.affectedRows > 0) {
      updated += 1;
    } else {
      missing += 1;
      console.warn(`Missing deckbuilder row for: ${name}`);
    }
  }

  console.log(
    `Rebuild complete. Updated: ${updated}, Missing: ${missing}, Total creators: ${counts.size}.`
  );
  await db.end();
}

(async () => {
  try {
    await rebuildCounts();
  } catch (error) {
    console.error("Rebuild failed:", error);
    process.exitCode = 1;
  }
})();
