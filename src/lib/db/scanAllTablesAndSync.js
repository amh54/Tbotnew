const registerOrUpdateDbCommand = require("./registerOrUpdateDbCommand");
const unregisterDbCommandByKey = require("./unregisterDbCommandByKey");

const fallbackDbCommandMap = new Map();

let warnedInvalidDbCommandMap = false;

const deckUpdatedDates = new Map();
let knownDeckIds = new Set();

const deckbuilderHashes = new Map();
let knownDeckbuilderIds = new Set();

let lastDeckbuilderSyncAt = 0;

const DECKBUILDER_SYNC_INTERVAL = 15 * 60 * 1000;

function resolveDbCommandMap(dbCommandMap) {
  const isMapLike =
    dbCommandMap &&
    typeof dbCommandMap.get === "function" &&
    typeof dbCommandMap.set === "function" &&
    typeof dbCommandMap.keys === "function" &&
    typeof dbCommandMap.entries === "function";

  if (isMapLike) {
    return dbCommandMap;
  }

  if (!warnedInvalidDbCommandMap) {
    warnedInvalidDbCommandMap = true;

    console.warn(
      "DB sync received invalid dbCommandMap. Falling back to internal map."
    );
  }

  return fallbackDbCommandMap;
}

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

function normalizeDeckId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const id = Number(value);

  return Number.isNaN(id) ? String(value) : id;
}

function normalizeDeckbuilderId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const id = Number(value);

  return Number.isNaN(id) ? String(value) : id;
}

function parseUpdatedDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  const match = stringValue.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/
  );

  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);

    let year = Number(match[3]);

    if (year < 100) {
      year += 2000;
    }

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.getTime();
    }

    return null;
  }

  const parsed = Date.parse(stringValue);

  return Number.isNaN(parsed) ? null : parsed;
}

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

  if (
    !dbCommandMap ||
    typeof dbCommandMap.keys !== "function"
  ) {
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

async function getDeckMetadata(db) {
  const result = await db.query(`
    SELECT deckid, updated_date, name
    FROM "web_decks"
  `);

  return result.rows || [];
}

async function getDeckRowsByIds(db, deckIds) {
  if (!deckIds.length) {
    return [];
  }

  const result = await db.query(
    `
      SELECT *
      FROM "web_decks"
      WHERE deckid = ANY($1::integer[])
    `,
    [deckIds]
  );

  return result.rows || [];
}

async function syncDecks(
  db,
  deckTable,
  client,
  dbCommandMap,
  dbTableColors,
  notificationChannelId,
  isInitialLoad
) {
  const options = {
    client,
    dbCommandMap,
    dbTableColors,
    notificationChannelId,
    isInitialLoad,
    db,
  };

  let metadataRows;

  try {
    metadataRows = await getDeckMetadata(db);
  } catch (err) {
    console.error(
      "[Scan] Query error for web_decks metadata:",
      err.message
    );

    return;
  }

  const currentDeckIds = new Set();
  const changedDeckIds = [];

  for (const row of metadataRows) {
    const deckId = normalizeDeckId(row.deckid);

    if (deckId === null) {
      continue;
    }

    currentDeckIds.add(deckId);

    if (isInitialLoad) {
      continue;
    }

    const currentUpdatedDate = row.updated_date ?? null;
    const previousUpdatedDate =
      deckUpdatedDates.get(deckId);

    const currentTimestamp =
      parseUpdatedDate(currentUpdatedDate);

    const previousTimestamp =
      parseUpdatedDate(previousUpdatedDate);

    const isNewDeck =
      !knownDeckIds.has(deckId);

    const dateChanged =
      currentTimestamp !== previousTimestamp ||
      String(currentUpdatedDate ?? "") !==
        String(previousUpdatedDate ?? "");

    if (isNewDeck || dateChanged) {
      changedDeckIds.push(deckId);
    }
  }

  if (isInitialLoad) {
    let rows;

    try {
      const result = await db.query(`
        SELECT *
        FROM "web_decks"
      `);

      rows = result.rows || [];
    } catch (err) {
      console.error(
        "[Scan] Query error for web_decks:",
        err.message
      );

      return;
    }

    const {
      seenKeys,
      currentDeckNames,
    } = await processTableRows(
      deckTable,
      rows,
      options
    );

    await removeDeletedCommands(
      deckTable.table,
      seenKeys,
      currentDeckNames,
      deckTable,
      options
    );

    deckUpdatedDates.clear();

    knownDeckIds = currentDeckIds;

    for (const row of metadataRows) {
      const deckId = normalizeDeckId(row.deckid);

      if (deckId !== null) {
        deckUpdatedDates.set(
          deckId,
          row.updated_date ?? null
        );
      }
    }

    return;
  }

  if (changedDeckIds.length > 0) {
    let changedRows;

    try {
      changedRows = await getDeckRowsByIds(
        db,
        changedDeckIds
      );
    } catch (err) {
      console.error(
        "[Scan] Query error for changed web_decks:",
        err.message
      );

      return;
    }

    await processTableRows(
      deckTable,
      changedRows,
      options
    );

    for (const row of changedRows) {
      const deckId = normalizeDeckId(row.deckid);

      if (deckId !== null) {
        deckUpdatedDates.set(
          deckId,
          row.updated_date ?? null
        );
      }
    }
  }

  const deletedDeckIds = [];

  for (const previousDeckId of knownDeckIds) {
    if (!currentDeckIds.has(previousDeckId)) {
      deletedDeckIds.push(previousDeckId);
    }
  }

  if (deletedDeckIds.length > 0) {
    const seenKeys = new Set();
    const currentDeckNames = new Set();

    for (const deckId of currentDeckIds) {
      seenKeys.add(`web_decks:${deckId}`);
    }

    for (const row of metadataRows) {
      if (row.name) {
        currentDeckNames.add(row.name);
      }
    }

    await removeDeletedCommands(
      deckTable.table,
      seenKeys,
      currentDeckNames,
      deckTable,
      options
    );

    for (const deckId of deletedDeckIds) {
      deckUpdatedDates.delete(deckId);
    }
  }

  knownDeckIds = currentDeckIds;
}

async function getDeckbuilderMetadata(db) {
  const result = await db.query(`
    SELECT
      id,
      md5(
        concat_ws(
          '||',
          COALESCE(deckbuilder_name, ''),
          COALESCE(color, ''),
          COALESCE(userid, ''),
          COALESCE(aliases, ''),
          COALESCE(numb_of_decks::text, '')
        )
      ) AS row_hash
    FROM "web_deckbuilders"
  `);

  return result.rows || [];
}

async function getDeckbuilderRowsByIds(db, ids) {
  if (!ids.length) {
    return [];
  }

  const result = await db.query(
    `
      SELECT *
      FROM "web_deckbuilders"
      WHERE id = ANY($1::integer[])
    `,
    [ids]
  );

  return result.rows || [];
}

async function syncDeckbuilders(
  db,
  deckbuilderTable,
  options
) {
  let metadataRows;

  try {
    metadataRows = await getDeckbuilderMetadata(db);
  } catch (err) {
    console.error(
      "[Scan] Query error for web_deckbuilders metadata:",
      err.message
    );

    return;
  }

  const currentIds = new Set();
  const changedIds = [];

  for (const row of metadataRows) {
    const id = normalizeDeckbuilderId(row.id);

    if (id === null) {
      continue;
    }

    currentIds.add(id);

    const previousHash =
      deckbuilderHashes.get(id);

    const isNew =
      !knownDeckbuilderIds.has(id);

    const hasChanged =
      previousHash !== row.row_hash;

    if (isNew || hasChanged) {
      changedIds.push(id);
    }
  }

  if (changedIds.length > 0) {
    let changedRows;

    try {
      changedRows =
        await getDeckbuilderRowsByIds(
          db,
          changedIds
        );
    } catch (err) {
      console.error(
        "[Scan] Query error for changed web_deckbuilders:",
        err.message
      );

      return;
    }

    await processTableRows(
      deckbuilderTable,
      changedRows,
      options
    );

    for (const row of changedRows) {
      const id = normalizeDeckbuilderId(row.id);

      if (id === null) {
        continue;
      }

      const metadataRow = metadataRows.find(
        (metadata) =>
          normalizeDeckbuilderId(metadata.id) === id
      );

      if (metadataRow) {
        deckbuilderHashes.set(
          id,
          metadataRow.row_hash
        );
      }
    }
  }

  const seenKeys = new Set();
  const currentDeckbuilderNames = new Set();

  for (const id of currentIds) {
    seenKeys.add(
      `web_deckbuilders:${id}`
    );
  }

  for (const row of metadataRows) {
    if (row.id !== null && row.id !== undefined) {
      const key =
        `web_deckbuilders:${row.id}`;

      const existing =
        options.dbCommandMap.get(key);

      if (existing?.rowData?.deckbuilder_name) {
        currentDeckbuilderNames.add(
          existing.rowData.deckbuilder_name
        );
      }
    }
  }

  await removeDeletedCommands(
    deckbuilderTable.table,
    seenKeys,
    currentDeckbuilderNames,
    deckbuilderTable,
    options
  );

  const deletedIds = [];

  for (const previousId of knownDeckbuilderIds) {
    if (!currentIds.has(previousId)) {
      deletedIds.push(previousId);
    }
  }

  for (const id of deletedIds) {
    deckbuilderHashes.delete(id);
  }

  knownDeckbuilderIds = currentIds;
  lastDeckbuilderSyncAt = Date.now();
}

async function scanStaticTable(
  db,
  tableConfig,
  options
) {
  let rows = [];

  try {
    const result = await db.query(
      `SELECT * FROM "${tableConfig.table}"`
    );

    rows = result.rows || [];
  } catch (err) {
    console.error(
      `[Scan] Query error for ${tableConfig.table}:`,
      err.message
    );

    return;
  }

  const {
    seenKeys,
    currentDeckNames,
  } = await processTableRows(
    tableConfig,
    rows,
    options
  );

  await removeDeletedCommands(
    tableConfig.table,
    seenKeys,
    currentDeckNames,
    tableConfig,
    options
  );
}

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

    const deckTable = dbTables.find(
      (table) =>
        table.table === "web_decks"
    );

    if (!deckTable) {
      console.error(
        "[Scan] web_decks is missing from dbTables."
      );

      return;
    }

    await syncDecks(
      db,
      deckTable,
      client,
      resolvedDbCommandMap,
      dbTableColors,
      notificationChannelId,
      isInitialLoad
    );

    if (isInitialLoad) {
      for (const tableConfig of dbTables) {
        if (tableConfig.table === "web_decks") {
          continue;
        }

        await scanStaticTable(
          db,
          tableConfig,
          options
        );

        if (
          tableConfig.table ===
          "web_deckbuilders"
        ) {
          const metadataRows =
            await getDeckbuilderMetadata(db);

          deckbuilderHashes.clear();
          knownDeckbuilderIds.clear();

          for (const row of metadataRows) {
            const id =
              normalizeDeckbuilderId(row.id);

            if (id === null) {
              continue;
            }

            knownDeckbuilderIds.add(id);
            deckbuilderHashes.set(
              id,
              row.row_hash
            );
          }
        }
      }

      lastDeckbuilderSyncAt = Date.now();

      return;
    }

    const now = Date.now();

    if (
      now - lastDeckbuilderSyncAt >=
      DECKBUILDER_SYNC_INTERVAL
    ) {
      const deckbuilderTable =
        dbTables.find(
          (table) =>
            table.table ===
            "web_deckbuilders"
        );

      if (deckbuilderTable) {
        await syncDeckbuilders(
          db,
          deckbuilderTable,
          options
        );
      }
    }
  } catch (err) {
    console.error(
      "DB command loader error:",
      err
    );
  }
}

let syncQueue = Promise.resolve();

async function runSerializedDbSync(...args) {
  const run = async () => {
    return scanAllTablesAndSync(...args);
  };

  const previous = syncQueue;

  syncQueue = previous.then(run, run);

  return syncQueue;
}

module.exports = runSerializedDbSync;