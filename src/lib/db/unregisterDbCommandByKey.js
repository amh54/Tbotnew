const sendDeckNotification = require("../../features/decks/sendDeckNotification");
const heroDeckThreadMap = require("../../features/heroes/heroDeckThreadMap");

/**
 * @description Unregisters a database command by its key
 * @param {*} key The key of the command to unregister
 * @param {Object} options Configuration options
 * @param {*} options.client Discord client
 * @param {Map} options.dbCommandMap Map of database commands
 * @param {Object} options.tableConfig Table configuration
 * @param {Object} options.dbTableColors Database table colors
 * @param {string} options.notificationChannelId Notification channel ID
 * @param {Set<string>} options.currentDeckNames Set of deck names from current database scan
 * @param {*} options.db Database connection
 * @returns {Promise<void>} Resolves when the command is unregistered
 */
async function unregisterDbCommandByKey(key, options) {
  const { client, dbCommandMap, tableConfig, dbTableColors, currentDeckNames, db = null } = options;
  const info = dbCommandMap.get(key);
  if (!info) return;
  
  // Check if this deck still exists with a different ID (name is in current scan)
  const deckMovedToNewId = currentDeckNames && info.rowData?.name && currentDeckNames.has(info.rowData.name);
  
  // Check if this command name is still being used by another key
  let commandStillInUse = false;
  for (const [otherKey, otherInfo] of dbCommandMap.entries()) {
    if (otherKey !== key && otherInfo.commandName === info.commandName) {
      commandStillInUse = true;
      break;
    }
  }
  
  dbCommandMap.delete(key);
  console.log(`DB command unregistered: ${info.commandName}${commandStillInUse ? ' (command still in use by another ID)' : ''}`);
  
  // Only send delete notification if deck was truly deleted, not just moved to new ID
  const isDeck = key.includes("decks");
  if (isDeck && !deckMovedToNewId && info.rowData && tableConfig && dbTableColors) {
    // Use hero-specific thread channel instead of general notification channel
    const threadChannelId = heroDeckThreadMap[tableConfig.table];
    if (threadChannelId) {
      await sendDeckNotification(client, threadChannelId, info.rowData, tableConfig, dbTableColors, 'delete');
    }
  }

  if (isDeck && !deckMovedToNewId && db) {
    await updateDeckbuilderCounts(db, info.rowData?.creator, -1);
  }
}

async function updateDeckbuilderCounts(db, creator, delta) {
  const creatorValue = (creator || "").toString();
  if (!creatorValue) return;

  const deckbuilderNames = extractDeckbuilderNames(creatorValue);
  if (deckbuilderNames.length === 0) return;

  try {
    for (const name of deckbuilderNames) {
      await db.query(
        `UPDATE deckbuilders
         SET numb_of_decks = GREATEST(COALESCE(numb_of_decks, 0) + ?, 0)
         WHERE deckbuilder_name = ?`,
        [delta, name]
      );
    }
  } catch (error) {
    console.error("Error updating deckbuilder counts:", error);
  }
}

function extractDeckbuilderNames(creator) {
  if (!creator) return [];
  const text = creator.toString();
  
  // Extract names from both "Created by" and "optimized by" lines
  const lines = text.split('\n');
  const names = [];
  
  for (const line of lines) {
    const createdMatch = line.match(/^Created by\s+(.+?)$/i);
    const optimizedMatch = line.match(/optimized by[:\s]+(.+?)$/i);
    
    if (createdMatch) {
      const creators = createdMatch[1]
        .replaceAll(/\s+(and|,)\s+/gi, ',')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean);
      names.push(...creators);
    }
    
    if (optimizedMatch) {
      const optimizers = optimizedMatch[1]
        .replaceAll(/\s+(and|,)\s+/gi, ',')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean);
      names.push(...optimizers);
    }
  }
  
  return [...new Set(names)];
}
module.exports = unregisterDbCommandByKey;