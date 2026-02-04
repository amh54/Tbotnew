const sendDeckNotification = require("./sendDeckNotification");
const heroDeckThreadMap = require("./heroDeckThreadMap");

/**
 * @description Unregisters a database command by its key
 * @param {*} key The key of the command to unregister
 * @param {Set<string>} currentDeckNames Set of deck names from current database scan
 * @returns {Promise<void>} Resolves when the command is unregistered
 */
async function unregisterDbCommandByKey(key, client, dbCommandMap, tableConfig, dbTableColors, notificationChannelId, currentDeckNames) {
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
  
  // Only delete the command if no other key is using it
  if (!commandStillInUse) {
    client.commands.delete(info.commandName);
  }
  
  dbCommandMap.delete(key);
  console.log(`DB command unregistered: ${info.commandName}${commandStillInUse ? ' (command still in use by another ID)' : ''}`);
  
  // Check if this was a manual deletion (to prevent duplicate notifications)
  const isManuallyDeleted = global.manuallyDeletedDecks?.has(key);
  
  // Only send delete notification if deck was truly deleted, not just moved to new ID, and not manually deleted
  const isDeck = key.includes("decks");
  if (isDeck && !deckMovedToNewId && !isManuallyDeleted && info.rowData && tableConfig && dbTableColors) {
    // Use hero-specific thread channel instead of general notification channel
    const threadChannelId = heroDeckThreadMap[tableConfig.table];
    if (threadChannelId) {
      await sendDeckNotification(client, threadChannelId, info.rowData, tableConfig, dbTableColors, 'delete');
    }
  }
}
module.exports = unregisterDbCommandByKey;