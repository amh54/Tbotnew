const registerOrUpdateDbCommand = require("./registerOrUpdateDbCommand");
const unregisterDbCommandByKey = require("./unregisterDbCommandByKey");

/**
 * @description Generates a unique key for a database row
 * @param {string} table - Table name
 * @param {object} row - Database row
 * @returns {string} Unique key
 */
function generateRowKey(table, row) {
  const identifier = row.DeckID ?? row.deckID ?? row.id ?? row.cardid ?? row.heroID ?? 
    row.card_name ?? row.title ?? row.name ?? row.deckbuilder_name 
    ?? row.herocommand ?? row.heroname;
  return `${table}:${identifier}`;
}

/**
 * @description Processes rows from a table and registers/updates commands
 * @param {object} t - Table configuration
 * @param {array} rows - Database rows
 * @param {object} options - Options object containing client, dbCommandMap, dbTableColors, notificationChannelId, isInitialLoad, db
 * @returns {object} Object containing seenKeys and currentDeckNames
 */
async function processTableRows(t, rows, options) {
  const { client, dbCommandMap, dbTableColors, notificationChannelId, isInitialLoad, db } = options;
  const seenKeys = new Set();
  const currentDeckNames = new Set();
  const channelId = isInitialLoad ? null : notificationChannelId;

  for (const row of rows || []) {
    const key = generateRowKey(t.table, row);
    seenKeys.add(key);
    
    if (row.name) {
      currentDeckNames.add(row.name);
    }
    
    await registerOrUpdateDbCommand(t, row, client, dbCommandMap, dbTableColors, channelId, db);
  }

  return { seenKeys, currentDeckNames };
}

/**
 * @description Removes commands for rows that no longer exist in the table
 * @param {string} table - Table name
 * @param {set} seenKeys - Keys that exist in current scan
 * @param {set} currentDeckNames - Deck names from current scan
 * @param {object} t - Table configuration
 * @param {object} options - Options object containing client, dbCommandMap, dbTableColors, notificationChannelId, isInitialLoad, db
 * @returns {Promise<void>}
 */
async function removeDeletedCommands(table, seenKeys, currentDeckNames, t, options) {
  const { client, dbCommandMap, dbTableColors, notificationChannelId, isInitialLoad, db } = options;
  const channelId = isInitialLoad ? null : notificationChannelId;

  for (const existingKey of Array.from(dbCommandMap.keys())) {
    if (!existingKey.startsWith(`${table}:`)) continue;
    if (!seenKeys.has(existingKey)) {
      await unregisterDbCommandByKey(existingKey, client, dbCommandMap, t, dbTableColors, channelId, currentDeckNames, db);
    }
  }
}

/**
 * @description Scans all configured tables and synchronizes commands
 * @returns {Promise<void>} Resolves when synchronization is complete
 */
async function scanAllTablesAndSync(db, dbTables, client, dbCommandMap, dbTableColors, notificationChannelId = null, isInitialLoad = false) {
  try {
    const options = { client, dbCommandMap, dbTableColors, notificationChannelId, isInitialLoad, db };
    for (const t of dbTables) {
      const [rows] = await db
        .query(`SELECT * FROM \`${t.table}\``)
        .catch((err) => {
          console.error(`[Scan] Query error for ${t.table}:`, err.message);
          return [[]];
        });

      const { seenKeys, currentDeckNames } = await processTableRows(t, rows, options);

      await removeDeletedCommands(t.table, seenKeys, currentDeckNames, t, options);
    }
  } catch (err) {
    console.error("DB command loader error:", err);
  }
}

module.exports = scanAllTablesAndSync;