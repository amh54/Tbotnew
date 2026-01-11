const { ActionRowBuilder } = require("discord.js");
const buildDeckBuilderFromRow = require("./buildDeckBuilderFromRow");
/**
 * Handles deckbuilder profile commands (deckbuilder_name present)
 */
async function handleDeckbuilderProfile(row, message, client) {
  if (!message.channel) {
    console.error("message.channel is undefined!");
    return;
  }

  try {
    const deckbuilderName = row.deckbuilder_name;
    const allDecks = [];
    
    const deckTables = [
      { table: "gsdecks", hero: "Green Shadow" },
      { table: "sfdecks", hero: "Solar Flare" },
      { table: "wkdecks", hero: "Wall Knight" },
      { table: "czdecks", hero: "Chompzilla" },
      { table: "spdecks", hero: "Spudow" },
      { table: "ctdecks", hero: "Citron" },
      { table: "gkdecks", hero: "Grass Knuckles" },
      { table: "ncdecks", hero: "Night Cap" },
      { table: "rodecks", hero: "Rose" },
      { table: "ccdecks", hero: "Captain Combustible" },
      { table: "bcdecks", hero: "Beta Carrotina" },
      { table: "sbdecks", hero: "Super Brainz" },
      { table: "smdecks", hero: "The Smash" },
      { table: "ifdecks", hero: "Impfinity" },
      { table: "rbdecks", hero: "Rustbolt" },
      { table: "ebdecks", hero: "Electric Boogaloo" },
      { table: "bfdecks", hero: "Brain Freeze" },
      { table: "pbdecks", hero: "Professor Brainstorm" },
      { table: "imdecks", hero: "Immorticia" },
      { table: "zmdecks", hero: "Z-Mech" },
      { table: "ntdecks", hero: "Neptuna" },
      { table: "hgdecks", hero: "Huge-Gigantacus" }
    ];

    const db = require("../index.js");
    for (const { table, hero } of deckTables) {
      try {
        const [decks] = await db.query(
          `SELECT * FROM ${table} WHERE creator LIKE ? AND creator NOT LIKE ?`,
          [`%${deckbuilderName}%`, `%inspired by ${deckbuilderName}%`]
        );
        
        for (const deck of decks) {
          allDecks.push({ ...deck, hero, table });
        }
      } catch (error) {
        console.error(`Error querying ${table} for ${deckbuilderName}:`, error);
      }
    }

    console.log(`Found ${allDecks.length} decks for ${deckbuilderName}`);

    if (allDecks.length === 0) {
      return message.channel.send(`No decks found for ${deckbuilderName}.`);
    }

    const { embed, select, deckLists, availableCategories, 
            deckbuilderName: returnedDeckbuilderName, color, userId } = 
      buildDeckBuilderFromRow(row, allDecks, client);
    
    let thumb = null;
    try {
      if (userId) {
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          thumb = user.displayAvatarURL();
          embed.setThumbnail(thumb);
        }
      }
    } catch (error) {
      console.error("Error fetching user for deckbuilder thumbnail:", error);
    }

    const m = await message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(select)]
    });

    if (!client.deckbuilderData) {
      client.deckbuilderData = new Map();
    }

    const tempKey = `temp_${returnedDeckbuilderName.toLowerCase().replaceAll(/\s+/g, "_")}_${m.id}`;
    client.deckbuilderData.set(tempKey, {
      deckbuilderName: returnedDeckbuilderName,
      deckLists,
      availableCategories,
      color: color,
      userId: userId,
      thumb: thumb,
    });
    
    console.log(`Stored deckbuilder data for message ID: ${m.id}`);
  } catch (error) {
    console.error("Error handling deckbuilder command:", error);
    await message.channel.send("An error occurred while loading deckbuilder data.");
  }
}
module.exports = handleDeckbuilderProfile;