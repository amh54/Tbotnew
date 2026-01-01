const { Events, ActivityType } = require("discord.js");
const XLSX = require('xlsx');
const path = require('node:path');

module.exports = {
  name: Events.ClientReady,
  async run(client) {
    const db = require("../index.js");
    
    // Store data on client for periodic updates
    client.deckData = [];
    client.statusData = [];

    // Initial load of deck and status data
    await updateDeckData(client, db);
    await updateStatusData(client, db);
    
    console.log(`Tbot is in ${client.guilds.cache.size} servers`)
    const totalMembers = client.guilds.cache
      .map((guild) => guild.memberCount)
      .reduce((a, b) => a + b, 0);
    client.user.setStatus("dnd");
    console.log(`${client.user.username} is online`);
    console.log(`${client.deckData.length} decks are in the tbot system`);
    console.log(`${client.statusData.length} custom statuses loaded from database`);
    
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
      "Tbonegaming344",
      "CardShark73",
      "Daily_PvZ",
      "TinyGargantuar",
      "SybertoxGaming",
      "Something_From_Space",
      "stormallan",
      "creeperblade711",
      "Autony",
      "Highlight Em Up",
    ];
    const streamers = [
      "Tbonegaming344",
      "PvzTryHard",
      "FryEmUp",
      "CardShark73",
      "koiuyp",
      "firsthero",
      "bluzacy_hipokryta",
      "stormallan",
      "Antonio009_PVZ",
      "boris_pvzh",
      "efesman",
    ];

    // Update status data every 30 minutes
    setInterval(async () => {
      await updateStatusData(client, db);
    }, 1800000); // 30 minutes

    // Update deck data every hour
    setInterval(async () => {
      await updateDeckData(client, db);
    }, 3600000); // 1 hour

    // Set activity status every 5 minutes
    setInterval(() => {
      const randomYoutubers =
        youtubers[Math.floor(Math.random() * youtubers.length)];
      const randomTourney =
        tourneys[Math.floor(Math.random() * tourneys.length)];
      let randomDeck = client.deckData[Math.floor(Math.random() * client.deckData.length)];
      const randomStreamers =
        streamers[Math.floor(Math.random() * streamers.length)];

      // Use current status data from client
      const customStatus = client.statusData.map(row => row.status);
      
      // Add dynamic statuses that use variables
      const dynamicStatuses = [
        //CGP23
        `Watching every ${randomYoutubers} video`,
        //icicle
        `Waiting for ${randomYoutubers} next post`,
        //Tbone
        `Playing ${randomDeck.name}`,
        `Throwing in ${randomTourney}`,
        `@Tbot help in ${client.guilds.cache.size} servers and serving decklists to ${totalMembers} users`,
        `Watching ${randomYoutubers}'s Lastest Video`,
        `Watching ${randomStreamers}'s Lastest stream`,
        `Waiting for ${randomStreamers}'s next Stream`,
        `${client.deckData.length} decks are in the tbot system`,
        `Craft ${randomDeck.name} today!`,
        //Maker
        `Stream Sniping ${randomStreamers}`,
      ];

      // Combine database statuses with dynamic ones
      const allStatuses = [...customStatus, ...dynamicStatuses];
      
      const status = allStatuses[Math.floor(Math.random() * allStatuses.length)];
      client.user.setActivity({
        type: ActivityType.Custom,
        name: `${status}`,
      });
    }, 300000); 
  },
};

// Function to update deck data from database
async function updateDeckData(client, db) {
  try {
    console.log('Updating deck data...');
    const [rows] = await db.query(`
        select name FROM sbdecks    
        union all select name from ccdecks 
        union all select name from sfdecks 
        union all select name from rodecks 
        union all select name from gsdecks 
        union all select name from wkdecks 
        union all select name from czdecks 
        union all select name from spdecks 
        union all select name from ctdecks 
        union all select name from bcdecks 
        union all select name from gkdecks 
        union all select name from ncdecks 
        union all select name from hgdecks 
        union all select name from zmdecks 
        union all select name from smdecks 
        union all select name from ifdecks 
        union all select name from rbdecks 
        union all select name from ebdecks 
        union all select name from bfdecks 
        union all select name from pbdecks 
        union all select name from imdecks
        union all select name from ntdecks`);
    
    client.deckData = rows;
    console.log(`Deck data updated: ${rows.length} decks`);
    
  } catch (error) {
    console.error('Error updating deck data:', error);
  }
}

// Function to update status data from database
async function updateStatusData(client, db) {
  try {
    console.log('Updating status data...');
    const [statusRows] = await db.query(`SELECT status, creator FROM customstatus`);
    
    // Check if data has changed
    const currentCount = client.statusData.length;
    const newCount = statusRows.length;
    
    if (currentCount !== newCount) {
      console.log(`Status data changed: ${currentCount} → ${newCount} statuses`);
    }
    
    // Update client data
    client.statusData = statusRows;
    
    // Always update the Excel file (same file, same path)
    await createStatusExcel(statusRows);
    
  } catch (error) {
    console.error('Error updating status data:', error);
  }
}

// Function to create/update Excel file with status data using XLSX
async function createStatusExcel(statusData) {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data array with headers
    const data = [
      ['Status', 'Creator'], // Headers
      ...statusData.map(row => [row.status, row.creator]) // Data rows
    ];
    
    // Create worksheet from array of arrays
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths (optional)
    const maxWidth = 100;
    const colWidths = [
      { wch: Math.min(Math.max(...data.map(row => (row[0] || '').toString().length)), maxWidth) },
      { wch: Math.min(Math.max(...data.map(row => (row[1] || '').toString().length)), maxWidth) }
    ];
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Custom Statuses');
    
    // Always save to the same file path
    const filePath = path.join(__dirname, '..', 'custom_statuses.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log(`Excel file updated: ${filePath}`);
    console.log(`Total statuses: ${statusData.length}`);
    
  } catch (error) {
    console.error('Error creating Excel file:', error);
  }
}