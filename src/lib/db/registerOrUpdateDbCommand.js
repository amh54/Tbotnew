const rowHash = require("./rowHash");

const sanitizeCommandName = require("../discord/sanitizeCommandName");

const sendDeckNotification = require("../../features/decks/sendDeckNotification");

const {
  resolveDeckbuilderNames,
} = require("../../features/decks/deckbuilderCredits");

/**
 * Extracts the unique key for a database row.
 */
function extractKeyFromRow(tableConfig, row) {
  return `${tableConfig.table}:${
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
    row.heroname
  }`;
}

/**
 * Gets the base command name from a database row.
 */
function getBaseName(row) {
  return (
    row.name ??
    row.card_name ??
    row.deckbuilder_name ??
    row.herocommand ??
    row.heroname ??
    "unamed"
  ).toString();
}

/**
 * Parses aliases from a database row.
 */
function parseAliases(row) {
  const aliasField = (
    row.aliases ??
    row.alias ??
    row.alias_list ??
    row.aliases_list ??
    ""
  ).toString();

  const parsedAliases = aliasField
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => a.toLowerCase());

  return Array.from(new Set(parsedAliases));
}

/**
 * Determines whether a row belongs to a deck table.
 */
function isDeckRow(tableConfig, row) {
  const hasDeckIdentifier =
    row.DeckID || row.deckID || row.deckid || row.id || row.deck_id;

  const isDeckTable = tableConfig.table?.includes("decks");

  return Boolean(hasDeckIdentifier && isDeckTable);
}

/**
 * Determines whether a deck is genuinely new.
 */
function isDeckTrulyNew(isDeck, existing, row, tableConfig, dbCommandMap) {
  if (!isDeck) return false;

  if (existing?.rowData) {
    return !(
      existing.rowData.name === row.name &&
      existing.rowData.description === row.description
    );
  }

  for (const [existingKey, existingValue] of dbCommandMap.entries()) {
    if (
      existingKey.startsWith(tableConfig.table + ":") &&
      existingValue.rowData
    ) {
      if (
        existingValue.rowData.name === row.name &&
        existingValue.rowData.description === row.description
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Detects changed fields on a row.
 */
function detectChangedFields(existing, row) {
  const changedFields = [];

  if (existing?.rowData) {
    if (existing.rowData.name !== row.name) {
      changedFields.push("name");
    }

    if (existing.rowData.description !== row.description) {
      changedFields.push("description");
    }

    if (existing.rowData.image !== row.image) {
      changedFields.push("image");
    }

    const prevCategory = existing.rowData.category ?? existing.rowData.type;

    const nextCategory = row.category ?? row.type;

    if (prevCategory !== nextCategory) {
      changedFields.push("category");
    }

    if (existing.rowData.type !== row.type) {
      changedFields.push("type");
    }
  }

  return changedFields;
}

/**
 * Handles deck notifications.
 */
async function handleDeckNotifications(
  isNewDeck,
  isUpdatedDeck,
  changedFields,
  options,
) {
  const {
    client,
    notificationChannelId,
    row,
    tableConfig,
    dbTableColors,
    existing,
  } = options;

  if (isNewDeck && notificationChannelId) {
    await sendDeckNotification(
      client,
      notificationChannelId,
      row,
      tableConfig,
      dbTableColors,
      {
        notificationType: "new",
      },
    );
  } else if (
    isUpdatedDeck &&
    notificationChannelId &&
    changedFields.length > 0
  ) {
    await sendDeckNotification(
      client,
      notificationChannelId,
      row,
      tableConfig,
      dbTableColors,
      {
        notificationType: "update",
        changedFields,
        existingRow: existing?.rowData,
      },
    );
  }
}
async function handleDeckbuilderCounts(
  isDeck,
  isNewDeck,
  creatorChanged,
  row,
  existing,
  db,
  isInitialLoad,
) {
  if (!isDeck || !db || isInitialLoad) {
    return;
  }

  if (isNewDeck) {
    await updateDeckbuilderCounts(db, row.creator, 1);
  } else if (creatorChanged) {
    await updateDeckbuilderCounts(db, existing.rowData?.creator, -1);

    await updateDeckbuilderCounts(db, row.creator, 1);
  }
}

/**
 * Registers or updates a database command.
 */
async function registerOrUpdateDbCommand(tableConfig, options) {
  /*
   * Backwards compatibility with the old
   * positional argument format.
   */
  if (!options?.row && arguments.length > 2) {
    const [
      ,
      row,
      client,
      dbCommandMap,
      dbTableColors,
      notificationChannelId,
      db,
      isInitialLoad,
    ] = arguments;

    options = {
      row,
      client,
      dbCommandMap,
      dbTableColors,
      notificationChannelId,
      db,
      isInitialLoad,
    };
  }

  const {
    row,
    client: resolvedClient,
    dbCommandMap: resolvedDbCommandMap,
    dbTableColors: resolvedDbTableColors = {},
    notificationChannelId: resolvedNotificationChannelId = null,
    db: resolvedDb = null,
    isInitialLoad: resolvedIsInitialLoad = false,
  } = options || {};

  if (
    !row ||
    !resolvedDbCommandMap ||
    typeof resolvedDbCommandMap.get !== "function"
  ) {
    console.error("registerOrUpdateDbCommand missing required data", {
      hasRow: Boolean(row),
      hasDbCommandMap: Boolean(resolvedDbCommandMap),
      dbCommandMapType: typeof resolvedDbCommandMap,
      dbCommandMapHasGet: Boolean(resolvedDbCommandMap?.get),
      table: tableConfig?.table,
    });

    return;
  }

  const key = extractKeyFromRow(tableConfig, row);

  const baseName = getBaseName(row);

  const baseSan = sanitizeCommandName(baseName);

  const hash = rowHash(row);

  const existing = resolvedDbCommandMap.get(key);

  if (existing?.hash === hash) {
    return;
  }

  const isDeck = isDeckRow(tableConfig, row);

  const isTrulyNew = isDeckTrulyNew(
    isDeck,
    existing,
    row,
    tableConfig,
    resolvedDbCommandMap,
  );

  const isNewDeck = isDeck && !existing && isTrulyNew;

  const isUpdatedDeck = isDeck && existing && existing.hash !== hash;

  const creatorChanged =
    isUpdatedDeck && existing?.rowData?.creator !== row.creator;

  const changedFields = detectChangedFields(existing, row);

  const aliasesArray = parseAliases(row);

  /*
   * Store the entire row, including the
   * class/card class from card_row.
   */
  resolvedDbCommandMap.set(key, {
    commandName: baseSan,
    aliases: aliasesArray,
    hash,
    rowData: row,
  });

  await handleDeckNotifications(isNewDeck, isUpdatedDeck, changedFields, {
    client: resolvedClient,
    notificationChannelId: resolvedNotificationChannelId,
    row,
    tableConfig,
    dbTableColors: resolvedDbTableColors,
    existing,
  });

  await handleDeckbuilderCounts(
    isDeck,
    isNewDeck,
    creatorChanged,
    row,
    existing,
    resolvedDb,
    resolvedIsInitialLoad,
  );
}

/**
 * Updates deckbuilder deck counts.
 *
 * PostgreSQL / Neon version.
 */
async function updateDeckbuilderCounts(db, creator, delta) {
  const creatorValue = (creator || "").toString();

  if (!creatorValue) {
    return;
  }

  const deckbuilderNames = await resolveDeckbuilderNames(db, creatorValue);

  if (deckbuilderNames.length === 0) {
    return;
  }

  try {
    for (const name of deckbuilderNames) {
      await db.query(
        `
        UPDATE deckbuilders
        SET numb_of_decks =
          GREATEST(
            COALESCE(numb_of_decks, 0) + $1,
            0
          )
        WHERE deckbuilder_name = $2
        `,
        [delta, name],
      );
    }
  } catch (error) {
    console.error("Error updating deckbuilder counts:", error);
  }
}

module.exports = registerOrUpdateDbCommand;
