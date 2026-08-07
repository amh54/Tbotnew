const mysql = require("mysql2/promise");
const { host, user, password, database } = require("../config.json");
const { resolveDeckbuilderNamesFromRows } = require("../src/features/decks/deckbuilderCredits");

async function main() {
  const db = await mysql.createConnection({ host, user, password, database });

  try {
    const [deckbuilderRows] = await db.query("SELECT deckbuilder_name, aliases FROM deckbuilders");
    const [rows] = await db.query("SELECT creator, name FROM tbot_decks");
    const counts = new Map();

    for (const row of rows) {
      const names = resolveDeckbuilderNamesFromRows(deckbuilderRows, row.creator);
      for (const name of names) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }

    await db.query("UPDATE deckbuilders SET numb_of_decks = 0");

    for (const [name, count] of counts) {
      await db.query(
        "UPDATE deckbuilders SET numb_of_decks = ? WHERE deckbuilder_name = ?",
        [count, name]
      );
    }

    console.log(`Rebuild complete. Updated ${counts.size} deckbuilders from ${rows.length} decks.`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Failed to rebuild deckbuilder counts:", error);
  process.exitCode = 1;
});