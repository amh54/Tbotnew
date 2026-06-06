const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const dbTableColors = require("../../lib/db/dbTableColors.js");
const buildCardEmbedFromRow = require("../../features/cards/buildCardEmbedFromRow.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("carddatabase")
    .setDescription("View all cards for a specific class")
    .addStringOption((option) =>
      option
        .setName("class")
        .setDescription("The plant or zombie class")
        .setRequired(true)
        .addChoices(
          { name: "Guardian", value: "guardian" },
          { name: "Kabloom", value: "kabloom" },
          { name: "Megagrow", value: "megagrow" },
          { name: "Smarty", value: "smarty" },
          { name: "Solar", value: "solar" },
          { name: "Beastly", value: "beastly" },
          { name: "Crazy", value: "crazy" },
          { name: "Brainy", value: "brainy" },
          { name: "Hearty", value: "hearty" },
          { name: "Sneaky", value: "sneaky" },
        )
    ),

  async execute(interaction) {
    const db = require("../../../index.js");
    const selectedClass = interaction.options.getString("class");

    try {
      // Acknowledge the interaction without sending a message yet
      await interaction.deferReply();

      // Map class to database tables
      const classMap = {
        guardian: { cards: "guardiancards", tricks: "guardiantricks" },
        smarty: { cards: "smartycards", tricks: "smartytricks" },
        kabloom: { cards: "kabloomcards", tricks: "kabloomtricks" },
        megagrow: { cards: "megagrowcards", tricks: "megagrowtricks" },
        solar: { cards: "solarcards", tricks: "solartricks" },
        sneaky: { cards: "sneakycards", tricks: "sneakytricks" },
        beastly: { cards: "beastlycards", tricks: "beastlytricks" },
        crazy: { cards: "crazycards", tricks: "crazytricks" },
        brainy: { cards: "brainycards", tricks: "brainytricks" },
        hearty: { cards: "heartycards", tricks: "heartytricks" }
      };

      const tables = classMap[selectedClass];
      if (!tables) {
        return interaction.editReply("Invalid class selected.");
      }

      // Fetch cards and tricks from the database
      const [cardRows] = await db.query(
        `SELECT * FROM \`${tables.cards}\``
      );

      const [trickRows] = await db.query(
        `SELECT * FROM \`${tables.tricks}\``
      );

      // Combine all cards with their full data
      const allCards = [
        ...cardRows.map(row => ({ ...row, cardType: "Minion" })),
        ...trickRows.map(row => ({ ...row, cardType: "Trick" }))
      ];

      // Sort all cards by cost (first number in stats field)
      allCards.sort((a, b) => {
        // Extract the first number from stats (before any space or special character)
        const statsA = a.stats ? a.stats.toString().trim() : "";
        const statsB = b.stats ? b.stats.toString().trim() : "";
        
        const costA = Number.parseInt(statsA.match(/^\d+/)?.[0] || "0", 10);
        const costB = Number.parseInt(statsB.match(/^\d+/)?.[0] || "0", 10);
        
        if (costA !== costB) {
          return costA - costB;
        }
        // Secondary sort by card name if costs are equal
        return (a.card_name || "").localeCompare(b.card_name || "");
      });

      if (allCards.length === 0) {
        return interaction.editReply(`No cards found for the ${selectedClass} class.`);
      }

      // Create embed for first page
      let currentPage = null; // null means show the list
      const tableNameForCards = classMap[selectedClass].cards;
      const classNameFormatted = selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1);

      const createListEmbed = () => {
        const cardNames = allCards.map(card => card.card_name).join("\n");
        
        const embed = new EmbedBuilder()
          .setTitle(`${classNameFormatted} Cards Database`)
          .setDescription(cardNames)
          .setColor(dbTableColors[tableNameForCards] || "#00FF00")
          .setFooter({
            text: `Total Cards: ${allCards.length}`
          });

        return embed;
      };

      const createCardEmbed = (cardIndex) => {
        const card = allCards[cardIndex];

        if (!card) {
          return new EmbedBuilder()
            .setTitle("No Card")
            .setColor(dbTableColors[tableNameForCards] || "#00FF00");
        }

        const embed = buildCardEmbedFromRow(card, tableNameForCards, dbTableColors);
        
        embed.setFooter({
          text: `Card ${cardIndex + 1} of ${allCards.length}`
        });

        return embed;
      };

      const createEmbed = () => {
        if (currentPage === null) {
          return createListEmbed();
        }
        return createCardEmbed(currentPage);
      };

      // Create navigation buttons
      const createButtons = () => {
        const row = new ActionRowBuilder();

        if (currentPage === null) {
          // On list view, show "View Details" button
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`carddatabase_viewdetails_${selectedClass}_0`)
              .setLabel("View Details →")
              .setStyle(ButtonStyle.Primary)
          );
        } else {
          // On card view, show navigation buttons
          // Previous button: goes to previous card, or back to list if on first card
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`carddatabase_prev_${selectedClass}_${currentPage > 0 ? currentPage - 1 : "list"}`)
              .setLabel(currentPage === 0 ? "Back to List" : "← Previous Card")
              .setStyle(ButtonStyle.Primary)
          );

          // Next button: goes to next card, or back to list if on last card
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`carddatabase_next_${selectedClass}_${currentPage < allCards.length - 1 ? currentPage + 1 : "list"}`)
              .setLabel(currentPage === allCards.length - 1 ? "Back to List" : "Next Card →")
              .setStyle(ButtonStyle.Primary)
          );
        }

        return row.components.length > 0 ? row : null;
      };

      const embed = createEmbed();
      const buttons = createButtons();

      let message;
      if (buttons) {
        message = await interaction.editReply({ embeds: [embed], components: [buttons] });
      } else {
        message = await interaction.editReply({ embeds: [embed] });
      }

      // Handle button interactions
      const filter = (i) =>
        i.customId.startsWith(`carddatabase_`) && i.user.id === interaction.user.id;

      const collector = message.createMessageComponentCollector({
        filter
      });

      collector.on("collect", async (buttonInteraction) => {
        const parts = buttonInteraction.customId.split("_");
        const cardIndexOrAction = parts[3];

        if (cardIndexOrAction === "list") {
          currentPage = null;
        } else {
          currentPage = Number.parseInt(cardIndexOrAction, 10);
        }

        const updatedEmbed = createEmbed();
        const updatedButtons = createButtons();

        if (updatedButtons) {
          await buttonInteraction.update({ embeds: [updatedEmbed], components: [updatedButtons] });
        } else {
          await buttonInteraction.update({ embeds: [updatedEmbed], components: [] });
        }
      });
    } catch (error) {
      console.error("Error in carddatabase command:", error);
      return interaction.editReply("An error occurred while fetching card data.");
    }
  }
};
