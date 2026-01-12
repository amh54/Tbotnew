const { MessageFlags } = require("discord.js");
const buildCardEmbedFromRow = require("../../Utilities/buildCardEmbedFromRow.js");

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

async function handleCardInfo(interaction, db) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const cardKey = interaction.customId.replace("cardinfo_", "");
  console.log("Fetching info for card:", cardKey);

  try {
    for (const t of tableConfig) {
      try {
        const [rows] = await db.query(
          `SELECT * FROM \`${t.table}\` WHERE card_name = ? LIMIT 1`,
          [cardKey]
        );

        const cardRow = rows[0];
        if (cardRow) {
          console.log("Built card embed from table:", t.table);
          const embed = buildCardEmbedFromRow(cardRow, t.table, dbTableColors);
          return await interaction.editReply({ embeds: [embed] });
        }
      } catch (tableError) {
        console.error(`Error querying table ${t.table}:`, tableError);
        continue;
      }
    }

    console.log("No card found for:", cardKey);
    await interaction.editReply({
      content: `No card found with the name "${cardKey}".`
    });
  } catch (error) {
    console.error("Error in cardinfo handler:", error);
    await interaction.editReply({
      content: "An error occurred while fetching card information."
    });
  }
}

module.exports = { handleCardInfo };
