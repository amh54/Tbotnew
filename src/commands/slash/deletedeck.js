const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { ownerId } = require("../../../config.json");
const sendDeckNotification = require("../../features/decks/sendDeckNotification.js");
const buildDeckEmbedFromRow = require("../../features/decks/buildDeckEmbedFromRow.js");
const dbTableColors = require("../../lib/db/dbTableColors.js");
const { HEROES } = require("../../features/heroes/heroDeckConfig.js");
const heroDeckThreadMap = require("../../features/heroes/heroDeckThreadMap.js");

const HERO_CHOICES = Object.values(HEROES).map((hero) => ({
  name: hero.hero,
  value: hero.hero
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletedeck")
    .setDescription("Delete a deck from the Tbot database (Owner only)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the deck to delete")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("The hero of the deck")
        .addChoices(...HERO_CHOICES)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    try {
      const db = require("../../../index.js");
      const focusedValue = interaction.options.getFocused();
      const search = (focusedValue || "").toLowerCase().replaceAll(/\s+/g, "");
      const hero = interaction.options.getString("hero");

      const params = [];
      let query = `SELECT name FROM tbot_decks`;
      if (hero) {
        query += ` WHERE LOWER(hero) = LOWER(?)`;
        params.push(hero);
      }
      query += ` ORDER BY name COLLATE utf8mb4_general_ci ASC LIMIT 100`;

      const [rows] = await db.query(query, params);
      const choices = [...new Set((rows || []).map((row) => row.name).filter(Boolean))]
        .filter((name) => !search || name.toLowerCase().replaceAll(/\s+/g, "").startsWith(search))
        .slice(0, 25);

      return interaction.respond(choices.map((name) => ({ name, value: name })));
    } catch (error) {
      console.error("Autocomplete error:", error);
      return interaction.respond([]);
    }
  },

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    const db = require("../../../index.js");
    const deckName = interaction.options.getString("name");
    const hero = interaction.options.getString("hero");
    const normalizedName = deckName.toLowerCase().replaceAll(/\s+/g, "");

    try {
      const [rows] = await db.query(
        `SELECT * FROM tbot_decks
         WHERE LOWER(hero) = LOWER(?)
           AND LOWER(REPLACE(name, ' ', '')) = ?
         LIMIT 1`,
        [hero, normalizedName]
      );

      if (!rows.length) {
        return interaction.editReply(`No ${hero} deck found with the name "${deckName}".`);
      }

      const deckData = rows[0];
      const deletionKey = `tbot_decks:${deckData.deckID ?? deckData.deckid ?? deckData.id ?? deckData.name}`;

      if (!globalThis.manuallyDeletedDecks) {
        globalThis.manuallyDeletedDecks = new Set();
      }

      try {
        const threadChannelId = heroDeckThreadMap[hero];
        if (threadChannelId) {
          await sendDeckNotification(
            interaction.client,
            threadChannelId,
            deckData,
            { table: "tbot_decks" },
            dbTableColors,
            { notificationType: "delete" }
          );
        }
      } catch (error) {
        console.error("Failed to send deletion notification:", error);
      }

      globalThis.manuallyDeletedDecks.add(deletionKey);
      await db.query(
        `DELETE FROM tbot_decks
         WHERE LOWER(hero) = LOWER(?)
           AND LOWER(REPLACE(name, ' ', '')) = ?`,
        [hero, normalizedName]
      );

      setTimeout(() => globalThis.manuallyDeletedDecks?.delete(deletionKey), 120000);

      return interaction.editReply(`✅ Successfully deleted "${deckData.name}" from tbot_decks.`);
    } catch (error) {
      console.error("Error deleting deck:", error);
      return interaction.editReply({ content: "An error occurred while trying to delete the deck." });
    }
  }
};