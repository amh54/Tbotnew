const mysql = require("mysql2");
const { host, user, password, database, port } = require("../config.json");
const { resolveDeckbuilderNamesFromRows } = require("../src/features/decks/deckbuilderCredits");

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

function addNameToTracking(name, count, table, deckName, counts, deckNamesByBuilder) {
  counts.set(name, (counts.get(name) || 0) + 1);
  if (deckName) {
    if (!deckNamesByBuilder.has(name)) {
      deckNamesByBuilder.set(name, new Map());
    }
    const tablesMap = deckNamesByBuilder.get(name);
    if (!tablesMap.has(table)) {
      tablesMap.set(table, new Set());
    }
    tablesMap.get(table).add(deckName);
  }
}

function formatDeckList(deckNamesByBuilder, name) {
  const tableDecks = deckNamesByBuilder.get(name);
  return tableDecks
    ? [...tableDecks.entries()]
        .sort(([tableA], [tableB]) => tableA.localeCompare(tableB))
        .map(([tableName, deckSet]) => `${tableName}: ${[...deckSet].sort((a, b) => a.localeCompare(b)).join(", ")}`)
        .join("; ")
    : "(no deck names found)";
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
  const deckNamesByBuilder = new Map();
  const [deckbuilderRows] = await db.query("SELECT deckbuilder_name, aliases FROM deckbuilders");

  for (const table of deckTables) {
    const [rows] = await db.query(`SELECT creator, name FROM \`${table}\``);
    for (const row of rows) {
      const names = resolveDeckbuilderNamesFromRows(deckbuilderRows, row.creator);
      for (const name of names) {
        addNameToTracking(name, 0, table, row.name, counts, deckNamesByBuilder);
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
      const deckList = formatDeckList(deckNamesByBuilder, name);
      console.warn(`Missing deckbuilder row for: ${name} | Decks: ${deckList}`);
    }
  }

  console.log(
    `Rebuild complete. Updated: ${updated}, Missing: ${missing}, Total creators: ${counts.size}.`
  );
  await db.end();
}

if (require.main === module) {
  rebuildCounts().catch((error) => {
    console.error("Rebuild failed:", error);
    process.exitCode = 1;
  });
}

module.exports = {
  rebuildCounts
};
