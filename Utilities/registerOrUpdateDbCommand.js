const fs = require("node:fs");
const path = require("node:path");
const rowHash = require("./rowHash");
const sanitizeCommandName = require("./sanitizeCommandName");
const routeCommandHandler = require("./routeCommandHandler");
const sendDeckNotification = require("./sendDeckNotification");
/**
 * @description Registers or updates a database command
 * @param {*} tableConfig  - The configuration for the database table
 * @param {*} row  - The database row object
 * @returns {Promise<void>} - Resolves when the command is registered or updated
 */
async function registerOrUpdateDbCommand(tableConfig, row, client, dbCommandMap, dbTableColors = {}, notificationChannelId = null) {
 const key = `${tableConfig.table}:${row.DeckID ?? row.deckID ?? row.id ?? row.cardid ?? row.heroID ?? 
  row.card_name ?? row.title ?? row.name ?? row.deckbuilder_name 
  ?? row.herocommand ?? row.heroname}`;
  
  const baseName = (
    row.name ??
    row.card_name ?? row.deckbuilder_name ?? row.herocommand ?? row.heroname  ?? "unamed"
  ).toString();
  const baseSan = sanitizeCommandName(baseName);
  const cmdName = baseSan;

  const hash = rowHash(row);

  const existing = dbCommandMap.get(key);
  // if unchanged, nothing to do
  if (existing?.hash === hash) return;
  const hasDeckIdentifier = row.DeckID || row.deckID || row.id || row.deck_id;
  const isDeckTable = tableConfig.table?.includes("decks");
  const isDeck = hasDeckIdentifier && isDeckTable;
  
  // Check if this is truly a new deck or just an ID change
  let isTrulyNew = true;
  if (isDeck && existing?.rowData) {
    // If the name and description match an existing deck, it's just an ID change, not a new deck
    const nameMatches = existing.rowData.name === row.name;
    const descMatches = existing.rowData.description === row.description;
    if (nameMatches && descMatches) {
      isTrulyNew = false;
    }
  } else if (isDeck && !existing) {
    // Check if this deck exists elsewhere with a different ID
    for (const [existingKey, existingValue] of dbCommandMap.entries()) {
      if (existingKey.startsWith(tableConfig.table + ':') && existingValue.rowData) {
        const nameMatches = existingValue.rowData.name === row.name;
        const descMatches = existingValue.rowData.description === row.description;
        if (nameMatches && descMatches) {
          isTrulyNew = false;
          break;
        }
      }
    }
  }
  
  const isNewDeck = isDeck && !existing && isTrulyNew;
  const isUpdatedDeck = isDeck && existing && existing.hash !== hash && existing.rowData?.name === row.name;

  // Detect which fields changed for deck updates
  let changedFields = [];
  if (isUpdatedDeck && existing.rowData) {
    if (existing.rowData.description !== row.description) {
      changedFields.push('description');
    }
    if (existing.rowData.image !== row.image) {
      changedFields.push('image');
    }
  }

  // parse aliases from possible columns (comma-separated)
  const aliasField = (
    row.aliases ||
    row.alias ||
    row.alias_list ||
    row.aliases_list ||
    ""
  ).toString();
  const parsedAliases = aliasField
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => a.toLowerCase())
  // include both plain and prefixed versions so users can invoke either form
  const aliasSet = new Set();
  for (const a of parsedAliases) {
    aliasSet.add(a);
  }
  const aliasesArray = Array.from(aliasSet);
  
  const commandModule = {
    name: cmdName,
    aliases: aliasesArray,
    category: tableConfig.category,
    run: async (client, message, args) => {
      return routeCommandHandler(row, client, message, args, tableConfig, dbTableColors);
    },
  };

  // set or overwrite command in client.commands
  client.commands.set(cmdName, commandModule);
  dbCommandMap.set(key, { commandName: cmdName, aliases: aliasesArray, hash, rowData: row });

  // Send notification for new or updated decks
  if (isNewDeck && notificationChannelId) {
    await sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, 'new');
  } else if (isUpdatedDeck && notificationChannelId && changedFields.length > 0) {
    await sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, 'update', changedFields);
  }
  const commandsForFile = Array.from(dbCommandMap.entries()).map(([key, value]) => [
  key,
  {
    commandName: value.commandName,
    aliases: value.aliases
  }
]);

fs.writeFileSync(
  path.join(__dirname, "..", "commands.json"),
  JSON.stringify(commandsForFile, null, 1)
);
}
module.exports = registerOrUpdateDbCommand;