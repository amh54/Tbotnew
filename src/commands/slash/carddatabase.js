const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");


const buildCardEmbedFromRow = require("../../features/cards/buildCardEmbedFromRow.js");

const CLASS_COLORS = {
  guardian: "#964B00",
  kabloom: "Red",
  megagrow: "Green",
  smarty: "White",
  solar: "Yellow",
  beastly: "Blue",
  brainy: "Purple",
  crazy: "Purple",
  hearty: "Orange",
  sneaky: "#000000",
};

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
          { name: "Brainy", value: "brainy" },
          { name: "Crazy", value: "crazy" },
          { name: "Hearty", value: "hearty" },
          { name: "Sneaky", value: "sneaky" },
        ),
    ),

  async execute(interaction) {
    const db = require("../../../index.js");

    const selectedClass = interaction.options.getString("class");

    try {
      await interaction.deferReply();

      const classDisplayName =
        selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1);
      const result = await db.query(
        `
        SELECT *
        FROM "web_cards"
        WHERE EXISTS (
          SELECT 1
          FROM unnest(string_to_array(card_type, ',')) AS class_value
          WHERE LOWER(TRIM(class_value)) = LOWER($1)
        )
        AND LOWER(COALESCE(set_rarity, '')) NOT LIKE '%hero%'
        ORDER BY card_name ASC
        `,
        [classDisplayName],
      );

      const allCards = (result.rows || []).map((row) => ({
        ...row,
        cardType: String(row.card_type || "")
          .toLowerCase()
          .includes("trick")
          ? "Trick"
          : "Minion",
      }));

      /*
       * Sort cards by the first number in stats,
       * then by card name.
       */
      allCards.sort((a, b) => {
        const statsA = a.stats ? a.stats.toString().trim() : "";

        const statsB = b.stats ? b.stats.toString().trim() : "";

        const costA = Number.parseInt(statsA.match(/^\d+/)?.[0] || "0", 10);

        const costB = Number.parseInt(statsB.match(/^\d+/)?.[0] || "0", 10);

        if (costA !== costB) {
          return costA - costB;
        }

        return (a.card_name || "").localeCompare(b.card_name || "", undefined, {
          sensitivity: "base",
        });
      });

      if (allCards.length === 0) {
        return interaction.editReply(
          `No cards found for the ${classDisplayName} class.`,
        );
      }

      let currentPage = null;

      const classColor = CLASS_COLORS[selectedClass] || "#00FF00";

      const createListEmbed = () => {
        const cardNames = allCards.map((card) => card.card_name).join("\n");

        return new EmbedBuilder()
          .setTitle(`${classDisplayName} Cards Database`)
          .setDescription(cardNames)
          .setColor(classColor)
          .setFooter({
            text: `Total Cards: ${allCards.length}`,
          });
      };

      const createCardEmbed = (cardIndex) => {
        const card = allCards[cardIndex];

        if (!card) {
          return new EmbedBuilder().setTitle("No Card").setColor(classColor);
        }

        const embed = buildCardEmbedFromRow(card, classColor);

        embed.setFooter({
          text: `Card ${cardIndex + 1} of ${allCards.length}`,
        });

        return embed;
      };

      const createEmbed = () => {
        if (currentPage === null) {
          return createListEmbed();
        }

        return createCardEmbed(currentPage);
      };

      const createButtons = () => {
        const row = new ActionRowBuilder();

        if (currentPage === null) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`carddatabase_viewdetails_${selectedClass}_0`)
              .setLabel("View Details →")
              .setStyle(ButtonStyle.Primary),
          );
        } else {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(
                `carddatabase_prev_${selectedClass}_${
                  currentPage > 0 ? currentPage - 1 : "list"
                }`,
              )
              .setLabel(currentPage === 0 ? "Back to List" : "← Previous Card")
              .setStyle(ButtonStyle.Primary),
          );

          row.addComponents(
            new ButtonBuilder()
              .setCustomId(
                `carddatabase_next_${selectedClass}_${
                  currentPage < allCards.length - 1 ? currentPage + 1 : "list"
                }`,
              )
              .setLabel(
                currentPage === allCards.length - 1
                  ? "Back to List"
                  : "Next Card →",
              )
              .setStyle(ButtonStyle.Primary),
          );
        }

        return row.components.length > 0 ? row : null;
      };

      const embed = createEmbed();
      const buttons = createButtons();

      const message = await interaction.editReply({
        embeds: [embed],
        components: buttons ? [buttons] : [],
      });

      const filter = (i) =>
        i.customId.startsWith("carddatabase_") &&
        i.user.id === interaction.user.id;

      const collector = message.createMessageComponentCollector({
        filter,
      });

      collector.on("collect", async (buttonInteraction) => {
        try {
          const parts = buttonInteraction.customId.split("_");

          const cardIndexOrAction = parts[3];

          if (cardIndexOrAction === "list") {
            currentPage = null;
          } else {
            currentPage = Number.parseInt(cardIndexOrAction, 10);
          }

          const updatedEmbed = createEmbed();

          const updatedButtons = createButtons();

          await buttonInteraction.update({
            embeds: [updatedEmbed],
            components: updatedButtons ? [updatedButtons] : [],
          });
        } catch (error) {
          console.error("Error handling carddatabase button:", error);

          if (!buttonInteraction.replied && !buttonInteraction.deferred) {
            await buttonInteraction.reply({
              content: "An error occurred.",
              ephemeral: true,
            });
          }
        }
      });
    } catch (error) {
      console.error("Error in carddatabase command:", error);

      return interaction.editReply(
        "An error occurred while fetching card data.",
      );
    }
  },
};
