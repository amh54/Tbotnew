const registerOrUpdateDbCommand = require("./registerOrUpdateDbCommand");
const unregisterDbCommandByKey = require("./unregisterDbCommandByKey");

const fallbackDbCommandMap = new Map();

let warnedInvalidDbCommandMap = false;

function resolveDbCommandMap(dbCommandMap) {
  const isMapLike =
    dbCommandMap &&
    typeof dbCommandMap.get === "function" &&
    typeof dbCommandMap.set === "function" &&
    typeof dbCommandMap.keys === "function" &&
    typeof dbCommandMap.entries === "function";

  if (isMapLike) return dbCommandMap;

  if (!warnedInvalidDbCommandMap) {
    warnedInvalidDbCommandMap = true;

    console.warn(
      "DB sync received invalid dbCommandMap. Falling back to internal map."
    );
  }

  return fallbackDbCommandMap;
}

/**
 * Generates a unique key for a database row.
 *
 * @param {string} table - Table name
 * @param {object} row - Database row
 * @returns {string} Unique key
 */
function generateRowKey(table, row) {
  const identifier =
    row.DeckID ??
    row.deckID ??
    row.deckid ??
    row.id ??
    row.cardid ??
    row.heroID ??
    row.card_name ??
    row.title ??
    row.name ??
    row.deckbuilder_name ??
    row.herocommand ??
    row.heroname;

  return `${table}:${identifier}`;
}

/**
 * Processes rows from a table and registers/updates commands.
 *
 * @param {object} t - Table configuration
 * @param {array} rows - Database rows
 * @param {object} options - Options
 * @returns {Promise<object>}
 */
async function processTableRows(t, rows, options) {
  const {
    client,
    dbCommandMap,
    dbTableColors,
    notificationChannelId,
    isInitialLoad,
    db,
  } = options;

  const seenKeys = new Set();
  const currentDeckNames = new Set();

  const channelId = isInitialLoad
    ? null
    : notificationChannelId;

  for (const row of rows || []) {
    const key = generateRowKey(t.table, row);

    seenKeys.add(key);

    if (row.name) {
      currentDeckNames.add(row.name);
    }

    await registerOrUpdateDbCommand(t, {
      row,
      client,
      dbCommandMap,
      dbTableColors,
      notificationChannelId: channelId,
      db,
      isInitialLoad,
    });
  }

  return {
    seenKeys,
    currentDeckNames,
  };
}

/**
 * Removes commands for rows that no longer exist in the table.
 *
 * @param {string} table - Table name
 * @param {Set} seenKeys - Keys that exist in current scan
 * @param {Set} currentDeckNames - Deck names from current scan
 * @param {object} t - Table configuration
 * @param {object} options - Options
 * @returns {Promise<void>}
 */
async function removeDeletedCommands(
  table,
  seenKeys,
  currentDeckNames,
  t,
  options
) {
  const {
    client,
    dbCommandMap,
    dbTableColors,
    notificationChannelId,
    isInitialLoad,
    db,
  } = options;

  const channelId = isInitialLoad
    ? null
    : notificationChannelId;

  if (!dbCommandMap || typeof dbCommandMap.keys !== "function") {
    console.warn(
      "DB command cleanup skipped: invalid dbCommandMap"
    );

    return;
  }

  for (const existingKey of Array.from(dbCommandMap.keys())) {
    if (!existingKey.startsWith(`${table}:`)) {
      continue;
    }

    if (!seenKeys.has(existingKey)) {
      await unregisterDbCommandByKey(existingKey, {
        client,
        dbCommandMap,
        tableConfig: t,
        dbTableColors,
        notificationChannelId: channelId,
        currentDeckNames,
        db,
      });
    }
  }
}

/**
 * Scans all configured tables and synchronizes commands.
 *
 * PostgreSQL/Neon version.
 *
 * @returns {Promise<void>}
 */
async function scanAllTablesAndSync(
  db,
  dbTables,
  client,
  dbCommandMap,
  dbTableColors,
  notificationChannelId = null,
  isInitialLoad = false
) {
  try {
    const resolvedDbCommandMap =
      resolveDbCommandMap(dbCommandMap);

    const options = {
      client,
      dbCommandMap: resolvedDbCommandMap,
      dbTableColors,
      notificationChannelId,
      isInitialLoad,
      db,
    };

    for (const t of dbTables) {
      let rows = [];

      try {
        /*
         * PostgreSQL uses double quotes for identifiers.
         *
         * The table names come from your own dbTables configuration,
         * not user input, so this is safe here.
         */
        const result = await db.query(
          `SELECT * FROM "${t.table}"`
        );

        rows = result.rows || [];
      } catch (err) {
        console.error(
          `[Scan] Query error for ${t.table}:`,
          err.message
        );

        continue;
      }

      const {
        seenKeys,
        currentDeckNames,
      } = await processTableRows(
        t,
        rows,
        options
      );

      await removeDeletedCommands(
        t.table,
        seenKeys,
        currentDeckNames,
        t,
        options
      );
    }
  } catch (err) {
    console.error(
      "DB command loader error:",
      err
    );
  }
}

let syncInFlight = false;

let syncQueue = Promise.resolve();

async function runSerializedDbSync(...args) {
  const run = async () => {
    syncInFlight = true;

    try {
      return await scanAllTablesAndSync(...args);
    } finally {
      syncInFlight = false;
    }
  };

  const previous = syncQueue;

  syncQueue = previous.then(run, run);

  return syncQueue;
}

module.exports = runSerializedDbSync;