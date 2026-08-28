/*
COPYRIGHT (C) 2026 Tbone All rights reserved. 
This project is about the Plants vs Zombies Heroes card game 
and showcases Unique and Viable opitimized decks for the card game
Author: Tbone Gaming 
*/
const {
  token,
  database_url,
  deckNotificationChannelId,
  newDeckNotificationThreadId,
  updateDeckNotificationThreadId
} = require("./config.json");
const scanAllTablesAndSync = require("./src/lib/db/scanAllTablesAndSync");
const {
  Client,
  Partials,
  Collection,
  GatewayIntentBits,
} = require("discord.js");
const client = new Client({
  partials: [Partials.Channel],
  intents: [
    GatewayIntentBits.Guilds,
  ],
});
const { Pool } = require("pg");

const dbPool = new Pool({
  connectionString: database_url,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 3,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function executeWithRetry(queryFn, attempt = 1) {
  try {
    return await queryFn();
  } catch (error) {
    const retryableErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "57P01",
      "57P02",
      "57P03",
    ];

    if (
      retryableErrors.includes(error?.code) &&
      attempt < 4
    ) {
      console.warn(
        `[DB] Database error (${error.code}), retrying in ${
          attempt * 2
        }s...`
      );

      await wait(attempt * 2000);

      return executeWithRetry(queryFn, attempt + 1);
    }

    throw error;
  }
}

let activeDbQuery = Promise.resolve();

const serializedQuery = (...args) => {
  const runQuery = () =>
    executeWithRetry(() => dbPool.query(...args));

  const previousQuery = activeDbQuery;

  const nextQuery = previousQuery.then(runQuery, runQuery);

  activeDbQuery = nextQuery.catch(() => {});

  return nextQuery;
};

const db = new Proxy(dbPool, {
  get(target, prop, receiver) {
    if (prop === "query") {
      return serializedQuery;
    }

    if (prop === "execute") {
      return (...args) => serializedQuery(...args);
    }

    return Reflect.get(target, prop, receiver);
  },
});

module.exports = db;
client.db = db;
client.slashCommands = new Collection();
const fs = require("node:fs");
const path = require("node:path");
const foldersPath = path.join(__dirname, "src", "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.slashCommands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}
const eventsPath = path.join(__dirname, "src", "events"); 
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  client.on(event.name, event.run);
}
client.login(token);

const dbTables = [
  { table: "web_decks", prefix: "deck", category: "Decks" },
  {table: "web_cards", prefix: "cards", category: "cards"},
  {table: "web_deckbuilders", prefix: "db", category: "DeckBuilders" },
  {table: "helpcommands", prefix: "help", category: "Miscellaneous" }, 
  {table: "herocommands", prefix: "help", category: "Miscellaneous" }
];

// map table name => embed color (hex). Adjust colors as desired.
const dbTableColors = {
  web_decks: "Random",
  Guardian: "#964B00",
  Kabloom: "Red",
  "Mega-Grow": "Green",
  Smarty: "White",
  Solar: "Yellow",
  Beastly: "Blue",
  Brainy: "Purple",
  Crazy: "Purple",
  Hearty: "Orange",
  Sneaky: "#000000",
};

// Start with empty map - let initial scan populate it fresh
const dbCommandMap = new Map();
const deckNotificationTargets = {
  defaultChannelId: deckNotificationChannelId,
  newDeckThreadId: newDeckNotificationThreadId,
  updateDeckThreadId: updateDeckNotificationThreadId
};

// initial load - skip notifications to prevent spam on startup
scanAllTablesAndSync(db, dbTables, client, dbCommandMap, dbTableColors, deckNotificationTargets, true);

// poll every 30s (adjust as needed) - enable notifications for real changes
setInterval(() => {
  scanAllTablesAndSync(db, dbTables, client, dbCommandMap, dbTableColors, deckNotificationTargets, false);
}, 30_000);
