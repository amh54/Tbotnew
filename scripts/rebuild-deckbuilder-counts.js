const { Client } = require("pg");

const { resolveDeckbuilderNamesFromRows } = require("../src/features/decks/deckbuilderCredits");

async function main() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await db.connect();

  try {
    const deckbuilderResult = await db.query(
      "SELECT deckbuilder_name, aliases FROM web_deckbuilders"
    );

    const deckbuilderRows = deckbuilderResult.rows;

    const decksResult = await db.query(
      "SELECT creator, name FROM web_decks"
    );

    const rows = decksResult.rows;

    const counts = new Map();

    for (const row of rows) {
      const names = resolveDeckbuilderNamesFromRows(
        deckbuilderRows,
        row.creator
      );

      for (const name of names) {
        counts.set(
          name,
          (counts.get(name) || 0) + 1
        );
      }
    }

    await db.query(
      "UPDATE web_deckbuilders SET numb_of_decks = 0"
    );

    for (const [name, count] of counts) {
      await db.query(
        `
        UPDATE web_deckbuilders
        SET numb_of_decks = $1
        WHERE deckbuilder_name = $2
        `,
        [count, name]
      );
    }

    console.log(
      `Rebuild complete. Updated ${counts.size} deckbuilders from ${rows.length} decks.`
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(
    "Failed to rebuild deckbuilder counts:",
    error
  );

  process.exitCode = 1;
});