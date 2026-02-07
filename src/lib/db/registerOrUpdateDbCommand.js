const rowHash = require("./rowHash");
const sanitizeCommandName = require("../discord/sanitizeCommandName");
const sendDeckNotification = require("../../features/decks/sendDeckNotification");
/**
 * @description Registers or updates a database command
 * @param {*} tableConfig  - The configuration for the database table
 * @param {*} row  - The database row object
 * @returns {Promise<void>} - Resolves when the command is registered or updated
 */
function extractKeyFromRow(tableConfig, row) {
  return `${tableConfig.table}:${row.DeckID ?? row.deckID ?? row.id ?? row.cardid ?? row.heroID ?? 
    row.card_name ?? row.title ?? row.name ?? row.deckbuilder_name 
    ?? row.herocommand ?? row.heroname}`;
}

function getBaseName(row) {
  return (
    row.name ??
    row.card_name ?? row.deckbuilder_name ?? row.herocommand ?? row.heroname ?? "unamed"
  ).toString();
}

function parseAliases(row) {
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
    .map((a) => a.toLowerCase());
  return Array.from(new Set(parsedAliases));
}

function isDeckRow(tableConfig, row) {
  const hasDeckIdentifier = row.DeckID || row.deckID || row.id || row.deck_id;
  const isDeckTable = tableConfig.table?.includes("decks");
  return hasDeckIdentifier && isDeckTable;
}

function isDeckTrulyNew(isDeck, existing, row, tableConfig, dbCommandMap) {
  if (!isDeck) return false;
  
  if (existing?.rowData) {
    return !(existing.rowData.name === row.name && existing.rowData.description === row.description);
  }
  
  for (const [existingKey, existingValue] of dbCommandMap.entries()) {
    if (existingKey.startsWith(tableConfig.table + ':') && existingValue.rowData) {
      if (existingValue.rowData.name === row.name && existingValue.rowData.description === row.description) {
        return false;
      }
    }
  }
  return true;
}

function detectChangedFields(existing, row) {
  const changedFields = [];
  if (existing?.rowData) {
    if (existing.rowData.description !== row.description) {
      changedFields.push('description');
    }
    if (existing.rowData.image !== row.image) {
      changedFields.push('image');
    }
  }
  return changedFields;
}

async function handleDeckNotifications(isNewDeck, isUpdatedDeck, changedFields, options) {
  const { client, notificationChannelId, row, tableConfig, dbTableColors } = options;
  if (isNewDeck && notificationChannelId) {
    await sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, 'new');
  } else if (isUpdatedDeck && notificationChannelId && changedFields.length > 0) {
    await sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, 'update', changedFields);
  }
}

async function handleDeckbuilderCounts(isDeck, isNewDeck, creatorChanged, row, existing, db) {
  if (!isDeck || !db) return;
  
  if (isNewDeck) {
    await updateDeckbuilderCounts(db, row.creator, 1);
  } else if (creatorChanged) {
    await updateDeckbuilderCounts(db, existing.rowData?.creator, -1);
    await updateDeckbuilderCounts(db, row.creator, 1);
  }
}

async function registerOrUpdateDbCommand(tableConfig, row, client, dbCommandMap, dbTableColors = {}, notificationChannelId = null, db = null) {
  const key = extractKeyFromRow(tableConfig, row);
  const baseName = getBaseName(row);
  const baseSan = sanitizeCommandName(baseName);
  const hash = rowHash(row);

  const existing = dbCommandMap.get(key);
  if (existing?.hash === hash) return;

  const isDeck = isDeckRow(tableConfig, row);
  const isTrulyNew = isDeckTrulyNew(isDeck, existing, row, tableConfig, dbCommandMap);
  
  const isNewDeck = isDeck && !existing && isTrulyNew;
  const isUpdatedDeck = isDeck && existing && existing.hash !== hash && existing.rowData?.name === row.name;
  const creatorChanged = isUpdatedDeck && existing?.rowData?.creator !== row.creator;

  const changedFields = detectChangedFields(existing, row);
  const aliasesArray = parseAliases(row);

  dbCommandMap.set(key, { commandName: baseSan, aliases: aliasesArray, hash, rowData: row });

  await handleDeckNotifications(isNewDeck, isUpdatedDeck, changedFields, { client, notificationChannelId, row, tableConfig, dbTableColors });
  await handleDeckbuilderCounts(isDeck, isNewDeck, creatorChanged, row, existing, db);
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
module.exports = registerOrUpdateDbCommand;