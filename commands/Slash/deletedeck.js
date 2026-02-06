const {SlashCommandBuilder} = require('discord.js');
const {ownerId} = require("../../config.json");
const sendDeckNotification = require("../../Utilities/sendDeckNotification.js");
const heroDeckThreadMap = require("../../Utilities/heroDeckThreadMap.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletedeck')
        .setDescription('Delete a deck from the Tbot database (Owner only)')
          .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the deck to update")
        .setRequired(true)
        .setAutocomplete(true)
)
.addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("The hero of the deck")
        .addChoices(
            {name: "Super Brainz", value: "sbdecks"},
            {name: "Citron", value: "ctdecks"},
            {name: "Rose", value: "rodecks"},
            {name: "Solar Flare", value: "sfdecks"},
            {name: "Grass Knuckles", value: "gkdecks"},
            {name: "Wall-Knight", value: "wkdecks"},
            {name: "Z-Mech", value: "zmdecks"},
            {name: "Chompzilla", value: "czdecks"},
            {name: "Spudow", value: "spdecks"},
            {name: "Beta-Carrotina", value: "bcdecks"},
            {name: "Night Cap", value: "ncdecks"},
            {name: "Huge-Gigantacus", value: "hgdecks"},
            {name: "Smash", value: "smdecks"},
            {name: "Impfinity", value: "ifdecks"},
            {name: "Rustbolt", value: "rbdecks"},
            {name: "Electric Boogaloo", value: "ebdecks"},
            {name: "Brain Freeze", value: "bfdecks"},
            {name: "Professor Brainstorm", value: "pbdecks"},
            {name: "Immorticia", value: "imdecks"},
            {name: "Neptuna", value: "ntdecks"},
            {name: "Captain Combustible", value: "ccdecks"},
            {name: "Green Shadow", value: "gsdecks"}, 
        )),
    async autocomplete(interaction) {
    try {
      const db = require("../../index.js");
      const focusedValue = interaction.options.getFocused();
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
        union all select name from ntdecks
      `);
      const choices = [
        ...new Set(rows.map((r) => r.name.toLowerCase().replaceAll(/\s+/g, "")))
      ].sort((a, b) => a.localeCompare(b));
      let filtered;
     if (focusedValue) {
        filtered = choices
          .filter((choice) =>
            choice.startsWith(focusedValue.toLowerCase().replaceAll(/\s+/g, ""))
          )
          .slice(0, 25);
      } else {
        filtered = choices.slice(0, 25);
      }
      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (err) {
      console.error("Autocomplete error:", err);
      await interaction.respond([]);
    }
  },
    async execute(interaction) {
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }
        await interaction.deferReply();
        const deckNameInput = interaction.options.getString("name").toLowerCase().replaceAll(/\s+/g, "");
        const heroTable = interaction.options.getString("hero");
        const db = require("../../index.js");
        try {
            const table = heroTable;
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE LOWER(REPLACE(name, ' ', '')) = ?`, [deckNameInput]);
            if (rows.length === 0) {
                return interaction.editReply(`No deck found with the name "${deckNameInput}" in the ${table} table.`);
            }
            const deckData = rows[0];
            const threadChannelId = heroDeckThreadMap[table];
            if (threadChannelId) {
                const dbTableColors = {
                    "sbdecks": "#9B59B6",
                    "ccdecks": "#E67E22",
                    "sfdecks": "#F1C40F",
                    "rodecks": "#E91E63",
                    "gsdecks": "#2ECC71",
                    "wkdecks": "#3498DB",
                    "czdecks": "#8E44AD",
                    "spdecks": "#95A5A6",
                    "ctdecks": "#1ABC9C",
                    "bcdecks": "#16A085",
                    "gkdecks": "#27AE60",
                    "ncdecks": "#8E44AD",
                    "hgdecks": "#3498DB",
                    "zmdecks": "#E74C3C",
                    "smdecks": "#E67E22",
                    "ifdecks": "#9B59B6",
                    "rbdecks": "#95A5A6",
                    "ebdecks": "#F39C12",
                    "bfdecks": "#3498DB",
                    "pbdecks": "#9B59B6",
                    "imdecks": "#8E44AD",
                    "ntdecks": "#3498DB"
                };
                try {
                    await sendDeckNotification(
                        interaction.client,
                        threadChannelId,
                        deckData,
                        { table },
                        dbTableColors,
                        'delete'
                    );
                    console.log('Deletion notification sent successfully');
                } catch (notifError) {
                    console.error('Failed to send deletion notification:', notifError);
                }
            } else {
                console.log('No thread channel ID found for table:', table);
            }
            
            if (!globalThis.manuallyDeletedDecks) {
                globalThis.manuallyDeletedDecks = new Set();
            }
            globalThis.manuallyDeletedDecks.add(`${table}:${deckData.DeckID || deckData.deckID || deckData.id}`);
            
            await db.query(`DELETE FROM ${table} WHERE LOWER(REPLACE(name, ' ', '')) = ?`, [deckNameInput]);
            // Clean up the marker after a short delay (longer than scan interval)
            setTimeout(() => {
                globalThis.manuallyDeletedDecks?.delete(`${table}:${deckData.DeckID || deckData.deckID || deckData.id}`);
            }, 10000);
            
            return interaction.editReply(`✅ Successfully deleted the deck "${deckData.name}" from the ${table} table.`);
            
        } catch (error) {
            console.error("Error deleting deck:", error);
            return interaction.editReply({ content: "An error occurred while trying to delete the deck." });
        }
    }
};