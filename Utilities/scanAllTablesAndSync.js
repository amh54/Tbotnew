const registerOrUpdateDbCommand = require("./registerOrUpdateDbCommand");
const unregisterDbCommandByKey = require("./unregisterDbCommandByKey");

/**
 * @description Scans all configured tables and synchronizes commands
 * @returns {Promise<void>} Resolves when synchronization is complete
 */
async function scanAllTablesAndSync(db, dbTables, client, dbCommandMap, dbTableColors, notificationChannelId = null, isInitialLoad = false) {
  try {
    for (const t of dbTables) {
      const [rows] = await db
        .query(`SELECT * FROM \`${t.table}\``)
        .catch((err) => {
          console.error(`[Scan] Query error for ${t.table}:`, err.message);
          return [[]];
        });
      const seenKeys = new Set();
      const currentDeckNames = new Set();

      for (const row of rows || []) {
        const key = `${t.table}:${row.DeckID ?? row.deckID ?? row.id ?? row.cardid ?? row.heroID ?? 
  row.card_name ?? row.title ?? row.name ?? row.deckbuilder_name 
  ?? row.herocommand ?? row.heroname}`;
        seenKeys.add(key);
        
        // Track deck names from current database scan
        if (row.name) {
          currentDeckNames.add(row.name);
        }
        
        // Skip notifications on initial load to prevent spam
        const channelId = isInitialLoad ? null : notificationChannelId;
        await registerOrUpdateDbCommand(t, row, client, dbCommandMap, dbTableColors, channelId);
      }

      // remove DB commands for rows that no longer exist
      for (const existingKey of Array.from(dbCommandMap.keys())) {
        if (!existingKey.startsWith(`${t.table}:`)) continue;
        if (!seenKeys.has(existingKey)) {
          const channelId = isInitialLoad ? null : notificationChannelId;
          await unregisterDbCommandByKey(existingKey, client, dbCommandMap, t, dbTableColors, channelId, currentDeckNames);
        }
      }
    }
  } catch (err) {
    console.error("DB command loader error:", err);
  }
}

module.exports = scanAllTablesAndSync;