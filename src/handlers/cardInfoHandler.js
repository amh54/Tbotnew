const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const buildCardEmbedFromRow = require("../features/cards/buildCardEmbedFromRow.js");

const tableConfig = {
  table: "web_cards",
};

const CLASS_COLORS = {
  Guardian: "#964B00",
  Kabloom: "Red",
  "Mega-Grow": "Green",
  Smarty: "White",
  Solar: "Yellow",
  Beastly: "Blue",
  Brainy: "Purple",
  Crazy: "Purple",
  Hearty: "Orange",
  Sneaky: "#000000",
};

function normalizeClassName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

const NORMALIZED_CLASS_COLORS = Object.fromEntries(
  Object.entries(CLASS_COLORS).map(([className, color]) => [
    normalizeClassName(className),
    color,
  ]),
);

function getClassColor(cardRow) {
  const cardType = cardRow?.card_type || "";

  const normalizedClass = normalizeClassName(cardType);

  return NORMALIZED_CLASS_COLORS[normalizedClass] || "Random";
}

function getRowValue(row, keys) {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      String(value).trim().toUpperCase() !== "NULL"
    ) {
      return value;
    }
  }

  return null;
}
function buildCardButtons(row) {
  const buttonLabel = getRowValue(row, ["button", "Button"]);

  const buttonEmoji = getRowValue(row, [
    "button_emoji",
    "Button_emoji",
    "buttonemoji",
    "Buttonemoji",
  ]);

  const buttonLabel2 = getRowValue(row, ["button2", "Button2"]);

  const buttonEmoji2 = getRowValue(row, [
    "button_emoji2",
    "Button_emoji2",
    "buttonemoji2",
    "Buttonemoji2",
  ]);

  if (!buttonLabel) {
    return null;
  }

  const rowBuilder = new ActionRowBuilder().addComponents(
    buildButton({
      customId: `cardinfo_${buttonLabel}`,
      label: buttonLabel,
      emoji: buttonEmoji,
      style: ButtonStyle.Primary,
    }),
  );

  if (buttonLabel2) {
    rowBuilder.addComponents(
      buildButton({
        customId: `cardinfo_${buttonLabel2}`,
        label: buttonLabel2,
        emoji: buttonEmoji2,
        style: ButtonStyle.Primary,
      }),
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

async function startCardInfoByName(
  interaction,
  db,
  cardName,
  isEphemeral = false,
) {
  const flags = isEphemeral ? MessageFlags.Ephemeral : undefined;

  await interaction.deferReply(flags ? { flags } : undefined);

  console.log("Fetching info for card:", cardName);

  try {
    const result = await db.query(
      `
      SELECT *
      FROM "web_cards"
      WHERE card_name = $1
      LIMIT 1
      `,
      [cardName],
    );

    const cardRow = result.rows[0];

    if (cardRow) {
      console.log("Built card embed from table:", tableConfig.table);

      const cardColor = getClassColor(cardRow);

      console.log("Card type:", cardRow.card_type);
      console.log("Card embed color:", cardColor);

      const embed = buildCardEmbedFromRow(cardRow, cardColor);

      const buttons = buildCardButtons(cardRow);

      return await interaction.editReply({
        embeds: [embed],
        components: buttons ? [buttons] : [],
      });
    }

    console.log("No card found for:", cardName);

    await interaction.editReply({
      content: `No card found with the name "${cardName}".`,
    });
  } catch (error) {
    console.error("Error in cardinfo handler:", error);

    await interaction.editReply({
      content: "An error occurred while fetching card information.",
    });
  }
}

async function handleCardInfo(interaction, db) {
  const cardKey = interaction.customId.replace("cardinfo_", "");

  return startCardInfoByName(interaction, db, cardKey, true);
}

module.exports = {
  handleCardInfo,
  startCardInfoByName,
};
