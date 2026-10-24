const { Events, ActivityType } = require("discord.js");
const {
  startDeckSuggestionWatcher,
} = require("../features/decks/processDeckSuggestions.js");
const crypto = require("node:crypto");
const XLSX = require("xlsx");
const path = require("node:path");

module.exports = {
  name: Events.ClientReady,

  async run(client) {
    const db = require("../../index.js");
    client.deckData = [];
    client.statusData = [];
    await updateDeckData(client, db);
    await updateStatusData(client, db);
    await startDeckSuggestionWatcher(client);
    console.log(`Tbot is in ${client.guilds.cache.size} servers`);

    const totalMembers = client.guilds.cache
      .map((guild) => guild.memberCount)
      .reduce((a, b) => a + b, 0);

    client.user.setStatus("dnd");

    console.log(`${client.user.username} is online`);
    console.log(`${client.deckData.length} decks are in the tbot system`);
    console.log(
      `${client.statusData.length} custom statuses loaded from database`,
    );

    const tourneys = [
      "Floral Federation",
      "PVZHTWJIZ",
      "Budget",
      "Gimmick",
      "Jupiter",
      "Martin Den",
      "PVZH Revived",
      "Quicksand",
      "Elo",
    ];

    const youtubers = [
      "FryEmUp",
      "PvzTryHard",
      "PVZHTbot",
      "AirheadZ",
      "SurferZombieFan",
      "Mr. AP",
      "Outcastsage",
      "zagzig",
      "Xenoblast",
      "Sustained_x",
      "TinyGargantuar",
      "SybertoxGaming",
      "Something_From_Space",
      "stormallan",
      "creeperblade711",
      "Highlight Em Up",
    ];

    const streamers = [
      "FryEmUp",
      "first hero",
      "Sustained_x",
      "SurferZombieFan",
    ];

    setInterval(async () => {
      await updateStatusData(client, db);
    }, 1800000);


    setInterval(async () => {
      await updateDeckData(client, db);
    }, 3600000);


    setInterval(() => {
      const randomYoutubers = youtubers[getSecureRandomIndex(youtubers.length)];

      const randomTourney = tourneys[getSecureRandomIndex(tourneys.length)];

      const randomDeck =
        client.deckData[getSecureRandomIndex(client.deckData.length)];

      const randomStreamers = streamers[getSecureRandomIndex(streamers.length)];

      const customStatus = client.statusData.map((row) => row.status);

      const dynamicStatuses = [
        `Watching every ${randomYoutubers} video`,
        `Waiting for ${randomYoutubers} next post`,
        `Playing ${randomDeck?.name || "PvZ Heroes"}`,
        `Throwing in ${randomTourney}`,
        `/help in ${client.guilds.cache.size} servers and serving decklists to ${totalMembers} users`,
        `Watching ${randomYoutubers}'s Lastest Video`,
        `Watching ${randomStreamers}'s Lastest stream`,
        `Waiting for ${randomStreamers}'s next Stream`,
        `${client.deckData.length} decks are in the tbot system`,
        `Craft ${randomDeck?.name || "a deck"} today!`,
        `Stream Sniping ${randomStreamers}`,
      ];

      const allStatuses = [...customStatus, ...dynamicStatuses];

      if (!allStatuses.length) {
        return;
      }

      const status = allStatuses[getSecureRandomIndex(allStatuses.length)];

      client.user.setActivity({
        type: ActivityType.Custom,
        name: status,
      });
    }, 300000);
  },
};

function getSecureRandomIndex(length) {
  if (!length) return 0;

  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);

  return Math.floor((randomValue / 0x100000000) * length);
}

// Function to update deck data from PostgreSQL
async function updateDeckData(client, db) {
  try {
    console.log("Updating deck data...");

    const result = await db.query(`
      SELECT name
      FROM web_decks
      ORDER BY LOWER(name) ASC
    `);

    const rows = result.rows || [];

    client.deckData = rows;

    console.log(`Deck data updated: ${rows.length} decks`);
  } catch (error) {
    console.error("Error updating deck data:", error);
  }
}

async function updateStatusData(client, db) {
  try {
    console.log("Updating status data...");

    const result = await db.query(`
      SELECT status, creator
      FROM customstatus
      ORDER BY creator, status
    `);

    const statusRows = result.rows || [];

    const hasChanged =
      JSON.stringify(client.statusData) !== JSON.stringify(statusRows);

    if (!hasChanged) {
      console.log("Status data unchanged. Skipping Excel update.");
      return;
    }

    console.log(
      `Status data changed: ${client.statusData.length} → ${statusRows.length} statuses`,
    );

    client.statusData = statusRows;

    await createStatusExcel(statusRows);
  } catch (error) {
    console.error("Error updating status data:", error);
  }
}

async function createStatusExcel(statusData) {
  try {
    const workbook = XLSX.utils.book_new();

    const data = [
      ["Status", "Creator"],
      ...statusData.map((row) => [row.status, row.creator]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    const maxWidth = 100;

    const colWidths = [
      {
        wch: Math.min(
          Math.max(...data.map((row) => (row[0] || "").toString().length)),
          maxWidth,
        ),
      },
      {
        wch: Math.min(
          Math.max(...data.map((row) => (row[1] || "").toString().length)),
          maxWidth,
        ),
      },
    ];

    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Statuses");

    const filePath = path.join(__dirname, "..", "..", "custom_statuses.xlsx");

    XLSX.writeFile(workbook, filePath);

    console.log(`Excel file updated: ${filePath}`);

    console.log(`Total statuses: ${statusData.length}`);
  } catch (error) {
    console.error("Error creating Excel file:", error);
  }
}
