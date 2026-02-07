const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const buildCardEmbedFromRow = require("../features/cards/buildCardEmbedFromRow.js");

const tableConfig = [
  { table: "guardiancards" },
  { table: "guardiantricks" },
  { table: "kabloomcards" },
  { table: "kabloomtricks" },
  { table: "megagrowcards" },
  { table: "megagrowtricks" },
  { table: "smartycards" },
  { table: "smartytricks" },
  { table: "solarcards" },
  { table: "solartricks" },
  { table: "beastlycards" },
  { table: "beastlytricks" },
  { table: "brainycards" },
  { table: "brainytricks" },
  { table: "crazycards" },
  { table: "crazytricks" },
  { table: "heartycards" },
  { table: "heartytricks" },
  { table: "sneakycards" },
  { table: "sneakytricks" }
];

const dbTableColors = {
  guardiancards: "#964B00",
  guardiantricks: "#964B00",
  kabloomcards: "Red",
  kabloomtricks: "Red",
  megagrowcards: "Green",
  megagrowtricks: "Green",
  smartycards: "White",
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

function getRowValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

function buildCardButtons(row) {
  const buttonLabel = getRowValue(row, ["button", "Button"]);
  const buttonEmoji = getRowValue(row, ["button_emoji", "Button_emoji", "buttonemoji", "Buttonemoji"]);
  const buttonLabel2 = getRowValue(row, ["button2", "Button2"]);
  const buttonEmoji2 = getRowValue(row, ["button_emoji2", "Button_emoji2", "buttonemoji2", "Buttonemoji2"]);

  if (!buttonLabel) return null;

  const rowBuilder = new ActionRowBuilder().addComponents(
    buildButton({
      customId: `cardinfo_${buttonLabel}`,
      label: buttonLabel,
      emoji: buttonEmoji,
      style: ButtonStyle.Primary,
    })
  );

  if (buttonLabel2) {
    rowBuilder.addComponents(
      buildButton({
        customId: `cardinfo_${buttonLabel2}`,
        label: buttonLabel2,
        emoji: buttonEmoji2,
        style: ButtonStyle.Primary,
      })
    );
  }

  return rowBuilder;
}

function buildButton({ customId, label, emoji, style }) {
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style);
  if (emoji) {
    button.setEmoji(emoji);
  }
  return button;
}

async function startCardInfoByName(interaction, db, cardName, isEphemeral = false) {
  const flags = isEphemeral ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply(flags ? { flags } : undefined);

  console.log("Fetching info for card:", cardName);

  try {
    for (const t of tableConfig) {
      try {
        const [rows] = await db.query(
          `SELECT * FROM \`${t.table}\` WHERE card_name = ? LIMIT 1`,
          [cardName]
        );

        const cardRow = rows[0];
        if (cardRow) {
          console.log("Built card embed from table:", t.table);
          const embed = buildCardEmbedFromRow(cardRow, t.table, dbTableColors);
          const buttons = buildCardButtons(cardRow);
          return await interaction.editReply({
            embeds: [embed],
            components: buttons ? [buttons] : [],
          });
        }
      } catch (tableError) {
        console.error(`Error querying table ${t.table}:`, tableError);
        continue;
      }
    }

    console.log("No card found for:", cardName);
    await interaction.editReply({
      content: `No card found with the name "${cardName}".`
    });
  } catch (error) {
    console.error("Error in cardinfo handler:", error);
    await interaction.editReply({
      content: "An error occurred while fetching card information."
    });
  }
}

async function handleCardInfo(interaction, db) {
  const cardKey = interaction.customId.replace("cardinfo_", "");
  return startCardInfoByName(interaction, db, cardKey, true);
}

module.exports = { handleCardInfo, startCardInfoByName };
