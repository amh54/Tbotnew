const {
  SlashCommandBuilder,
  ActionRowBuilder,
  MessageFlags
} = require("discord.js");
const buildDeckBuilderFromRow = require("../../Utilities/buildDeckBuilderFromRow.js");
const {
  getDeckbuilderAutocompleteResults,
  resolveDeckbuilderName
} = require("../../Utilities/deckbuilderAutocomplete.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deckbuilders")
    .setDescription("View decks made by a deckbuilder")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Deckbuilder name")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    try {
      const db = require("../../index.js");
      const focusedValue = interaction.options.getFocused();
      const results = await getDeckbuilderAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    await interaction.deferReply();

    const db = require("../../index.js");
    const deckbuilderInput = interaction.options.getString("name");
    const deckbuilderName = (await resolveDeckbuilderName(db, deckbuilderInput)) || deckbuilderInput;

    try {
      const [builderRows] = await db.query(
        "SELECT * FROM deckbuilders WHERE deckbuilder_name = ? LIMIT 1",
        [deckbuilderName]
      );

      if (!builderRows || builderRows.length === 0) {
        return interaction.editReply({
          content: `No deckbuilder found with the name "${deckbuilderName}".`
        });
      }

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

      const allDecks = [];
      for (const { table, hero } of deckTables) {
        try {
          const [decks] = await db.query(
            `SELECT * FROM ${table} WHERE creator LIKE ? AND creator NOT LIKE ?`,
            [`%${deckbuilderName}%`, `%inspired by ${deckbuilderName}%`]
          );

          for (const deck of decks) {
            allDecks.push({ ...deck, hero, table });
          }
        } catch (tableError) {
          console.error(`Error querying ${table} for ${deckbuilderName}:`, tableError);
        }
      }

      if (allDecks.length === 0) {
        return interaction.editReply({
          content: `No decks found for ${deckbuilderName}.`
        });
      }

      const {
        embed,
        select,
        deckLists,
        availableCategories,
        deckbuilderName: returnedDeckbuilderName,
        color,
        userId
      } = buildDeckBuilderFromRow(builderRows[0], allDecks, interaction.client);

      let thumb = null;
      try {
        if (userId) {
          const user = await interaction.client.users.fetch(userId).catch(() => null);
          if (user) {
            thumb = user.displayAvatarURL();
            embed.setThumbnail(thumb);
          }
        }
      } catch (error) {
        console.error("Error fetching user for deckbuilder thumbnail:", error);
      }

      const responseMessage = await interaction.editReply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(select)],
        fetchReply: true
      });

      if (!interaction.client.deckbuilderData) {
        interaction.client.deckbuilderData = new Map();
      }

      const tempKey = `temp_${returnedDeckbuilderName.toLowerCase().replaceAll(/\s+/g, "_")}_${responseMessage.id}`;
      interaction.client.deckbuilderData.set(tempKey, {
        deckbuilderName: returnedDeckbuilderName,
        deckLists,
        availableCategories,
        color,
        userId,
        thumb
      });
    } catch (error) {
      console.error("Error in deckbuilders command:", error);
      return interaction.editReply({
        content: "An error occurred while loading deckbuilder data."
      });
    }
  }
};
