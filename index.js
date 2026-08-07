/*
COPYRIGHT (C) 2025 Tbone, Tbonegaming18@gmail.com All rights reserved. 
This project is about the Plants vs Zombies Heroes card game 
and showcases Unique and Viable opitimized decks for the card game
Author: Tbone Gaming 
        Tbonegaming18@gmail.com
*/
const {
  token,
  user,
  host,
  password,
  database,
  deckNotificationChannelId,
  newDeckNotificationThreadId,
  updateDeckNotificationThreadId
} = require("./config.json");
const scanAllTablesAndSync = require("./src/lib/db/scanAllTablesAndSync");
const mysql = require(`mysql2`);
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
const dbPool = mysql
  .createPool({
    host: host,
    user: user,
    password: password,
    database: database,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 10000,
    idleTimeout: 60000,
  })
  .promise();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeWithRetry(queryFn, attempt = 1) {
  try {
    return await queryFn();
  } catch (error) {
    if (error?.code === "ER_CON_COUNT_ERROR" && attempt < 4) {
      console.warn(`[DB] Connection limit reached, retrying in ${attempt * 2}s...`);
      await wait(attempt * 2000);
      return executeWithRetry(queryFn, attempt + 1);
    }
    throw error;
  }
}

let activeDbQuery = Promise.resolve();
const serializedQuery = (...args) => {
  const runQuery = () => executeWithRetry(() => dbPool.query(...args));
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
  { table: "tbot_decks", prefix: "deck", category: "Decks" },
  { table: "guardiancards", prefix: "gc", category: "Plant Cards" },
  {table: "guardiantricks", prefix: "gt", category: "Tricks Phase" },
  { table: "kabloomcards", prefix: "kc", category: "Plant Cards"},
  {table: "kabloomtricks", prefix: "kt", category: "Tricks Phase" },
  { table: "megagrowcards", prefix: "mgc", category: "Plant Cards"},
  {table: "megagrowtricks", prefix: "mgt", category: "Tricks Phase" },
  { table: "smartycards", prefix: "sc", category: "Plant Cards"},
  {table: "smartytricks", prefix: "st", category: "Tricks Phase" },
  { table: "solarcards", prefix: "slc", category: "Plant Cards"},
  {table: "solartricks", prefix: "slt", category: "Tricks Phase" },
  { table: "beastlycards", prefix: "bc", category: "Zombie Cards"},
  {table: "beastlytricks", prefix: "bt", category: "Tricks Phase" },
  { table: "brainycards", prefix: "brc", category: "Zombie Cards"},
  {table: "brainytricks", prefix: "brt", category: "Tricks Phase" },
  { table: "crazycards", prefix: "crc", category: "Zombie Cards"},
  {table: "crazytricks", prefix: "crt", category: "Tricks Phase" },
  { table: "heartycards", prefix: "hc", category: "Zombie Cards"},
  {table: "heartytricks", prefix: "ht", category: "Tricks Phase" },
  {table: "sneakycards", prefix: "snc", category: "Zombie Cards"},
  {table: "sneakytricks", prefix: "snt", category: "Tricks Phase" },
  {table: "deckbuilders", prefix: "db", category: "DeckBuilders" },
  {table: "helpcommands", prefix: "help", category: "Miscellaneous" }, 
  {table: "herocommands", prefix: "help", category: "Miscellaneous" }
];

// map table name => embed color (hex). Adjust colors as desired.
const dbTableColors = {
  tbot_decks: "Random",
  guardiancards: "#964B00",
  guardiantricks: "#964B00",
  kabloomcards: "Red",
  kabloomtricks: "Red",
  megagrowcards: "Green",
  megagrowtricks: "Green",
  smartycards2: "White",
  smartytricks: "White",
  solarcards: "Yellow",
  solartricks: "Yellow",
  beastlycards: "Blue",
  beastlytricks: "Blue",
  brainycards: "Purple",
  brainytricks: "Purple",
  crazycards: "Purple",
  crazytricks: "Purple",
  heartycards: "Orange",
  heartytricks: "Orange",
  sneakycards: "#000000",
  sneakytricks: "#000000"
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
