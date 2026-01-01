/**
 * @description Unregisters a database command by its key
 * @param {*} key The key of the command to unregister
 * @returns {Promise<void>} Resolves when the command is unregistered
 */
async function unregisterDbCommandByKey(key, client, dbCommandMap) {
  const info = dbCommandMap.get(key);
  if (!info) return;
  client.commands.delete(info.commandName);
  dbCommandMap.delete(key);
  console.log(`DB command unregistered: ${info.commandName}`);
}
module.exports = unregisterDbCommandByKey;