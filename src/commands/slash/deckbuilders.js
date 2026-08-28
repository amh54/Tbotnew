const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");

const buildDeckBuilderFromRow = require("../../features/decks/buildDeckBuilderFromRow.js");

const {
  deckMatchesDeckbuilder,
  getDeckbuilderSearchNames,
} = require("../../features/decks/deckbuilderCredits.js");

const {
  getDeckbuilderAutocompleteResults,
  resolveDeckbuilderName,
} = require("../../features/decks/deckbuilderAutocomplete.js");

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
      const db = require("../../../index.js");

      const focusedValue = interaction.options.getFocused();

      const results = await getDeckbuilderAutocompleteResults(
        db,
        focusedValue
      );

      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.deferReply();

    const db = require("../../../index.js");

    const deckbuilderInput =
      interaction.options.getString("name");

    const deckbuilderName =
      (await resolveDeckbuilderName(
        db,
        deckbuilderInput
      )) || deckbuilderInput;

    try {
      // PostgreSQL: result.rows instead of MySQL [rows]
      const { rows: builderRows } = await db.query(
        `
          SELECT *
          FROM web_deckbuilders
          WHERE deckbuilder_name = $1
          LIMIT 1
        `,
        [deckbuilderName]
      );

      if (!builderRows || builderRows.length === 0) {
        return interaction.editReply({
          content: `No deckbuilder found with the name "${deckbuilderName}".`,
        });
      }

      const deckbuilderRow = builderRows[0];

      const searchNames =
        getDeckbuilderSearchNames(deckbuilderRow);

      /*
       * PostgreSQL uses $1, $2, etc.
       *
       * Each search name gets three parameters:
       * creator
       * optimization
       * inspiration
       */
      const whereParts = [];
      const params = [];

      searchNames.forEach((name) => {
        const creatorParam = params.length + 1;
        const optimizationParam = params.length + 2;
        const inspirationParam = params.length + 3;

        whereParts.push(`
          (
            creator ILIKE $${creatorParam}
            OR optimization ILIKE $${optimizationParam}
            OR inspiration ILIKE $${inspirationParam}
          )
        `);

        const searchValue = `%${name}%`;

        params.push(
          searchValue,
          searchValue,
          searchValue
        );
      });

      const whereClause = whereParts.join(" OR ");

      const { rows: decks } = await db.query(
        `
          SELECT *
          FROM web_decks
          WHERE ${whereClause}
          ORDER BY LOWER(name) ASC
        `,
        params
      );

      const allDecks = decks
        .filter((deck) => {
          const credits = `
            ${deck.creator || ""}
            ${deck.optimization || ""}
            ${deck.inspiration || ""}
          `;

          return deckMatchesDeckbuilder(
            credits,
            deckbuilderRow
          );
        })
        .map((deck) => ({
          ...deck,
          category: deck.category,
          creator: deck.creator || "",
          inspiration: deck.inspiration || "",
          optimization: deck.optimization || "",
          suggested_date:
            deck.suggested_date || null,
          updated_date:
            deck.updated_date || null,
          table: "web_decks",
        }));

      if (allDecks.length === 0) {
        return interaction.editReply({
          content: `No decks found for ${deckbuilderName}.`,
        });
      }

      const {
        embed,
        select,
        deckLists,
        availableCategories,
        deckbuilderName: returnedDeckbuilderName,
        color,
        userId,
      } = buildDeckBuilderFromRow(
        builderRows[0],
        allDecks,
        interaction.client
      );

      let thumb = null;

      if (userId) {
        try {
          const user =
            await interaction.client.users
              .fetch(userId)
              .catch(() => null);

          if (user) {
            thumb = user.displayAvatarURL();
            embed.setThumbnail(thumb);
          }
        } catch (error) {
          console.error(
            "Error fetching deckbuilder avatar:",
            error
          );
        }
      }

      const response = await interaction.editReply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(select),
        ],
        withResponse: true,
      });

      const responseMessage =
        response.resource?.message ||
        (typeof interaction.fetchReply === "function"
          ? await interaction.fetchReply()
          : null);

      if (!responseMessage) return;

      if (!interaction.client.deckbuilderData) {
        interaction.client.deckbuilderData = new Map();
      }

      const tempKey = `temp_${returnedDeckbuilderName
        .toLowerCase()
        .replace(/\s+/g, "_")}_${responseMessage.id}`;

      interaction.client.deckbuilderData.set(tempKey, {
        deckbuilderName: returnedDeckbuilderName,
        deckLists,
        availableCategories,
        color,
        userId,
        thumb,
      });
    } catch (error) {
      console.error(
        "Error in deckbuilders command:",
        error
      );

      return interaction.editReply({
        content:
          "An error occurred while loading deckbuilder data.",
      });
    }
  },
};