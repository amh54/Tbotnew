const {
  EmbedBuilder,
  resolveColor,
  SlashCommandBuilder
} = require("discord.js");
const { ownerId } = require("../../../config.json");

const DECKBUILDER_LOG_THREAD_ID = "1516609490743464107";

function normalizeName(value) {
  return (value || "").toString().toLowerCase().replaceAll(/\s+/g, "");
}

function normalizeAliases(value) {
  return (value || "")
    .toString()
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean)
    .join(", ");
}

function safeEmbedColor(color) {
  const trimmed = (color || "").trim();
  return trimmed || "Random";
}

function isValidEmbedColor(color) {
  try {
    resolveColor(safeEmbedColor(color));
    return true;
  } catch {
    return false;
  }
}

async function sendDeckbuilderLog(client, row, addedBy) {
  const thread = await client.channels.fetch(DECKBUILDER_LOG_THREAD_ID).catch(() => null);
  if (!thread) {
    throw new Error(`Unable to fetch deckbuilder log thread: ${DECKBUILDER_LOG_THREAD_ID}`);
  }

  const user = await client.users.fetch(row.userID).catch(() => null);
  const embed = new EmbedBuilder()
    .setTitle(`${row.deckbuilder_name} added as deckbuilder`)
    .setColor(safeEmbedColor(row.color))
    .addFields(
      { name: "Deckbuilder", value: row.deckbuilder_name, inline: true },
      { name: "Discord User", value: `<@${row.userID}>`, inline: true },
      { name: "Color", value: row.color || "N/A", inline: true },
    )
    .setFooter({ text: `Added by ${addedBy.tag}` })
    .setTimestamp();

  if (user) {
    embed.setThumbnail(user.displayAvatarURL());
  }

  if (row.aliases) {
    embed.addFields({ name: "Aliases", value: row.aliases, inline: false });
  }

  await thread.send({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adddeckbuilder")
    .setDescription("Add a deckbuilder to the Tbot database (Owner only)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Deckbuilder name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Embed color for this deckbuilder, like #87CEEB or Blue")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user for this deckbuilder")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("aliases")
        .setDescription("Comma-separated aliases for this deckbuilder")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("deck_count")
        .setDescription("Starting number of decks")
        .setMinValue(0)
        .setRequired(false)
    ),
  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "You do not have permission to use this command."
      });
    }

    await interaction.deferReply();

    const db = require("../../../index.js");
    const deckbuilderName = interaction.options.getString("name").trim();
    const color = interaction.options.getString("color").trim();
    const user = interaction.options.getUser("user");
    const aliases = normalizeAliases(interaction.options.getString("aliases"));
    const deckCount = interaction.options.getInteger("deck_count") ?? 0;

    if (!deckbuilderName) {
      return interaction.editReply({ content: "Deckbuilder name cannot be blank." });
    }

    if (!isValidEmbedColor(color)) {
      return interaction.editReply({
        content: "Invalid color. Use a hex color like #87CEEB or a Discord color name like Blue, Purple, or White."
      });
    }

    try {
      const [existingRows] = await db.query(
        "SELECT deckbuilder_name FROM deckbuilders WHERE LOWER(REPLACE(deckbuilder_name, ' ', '')) = ? LIMIT 1",
        [normalizeName(deckbuilderName)]
      );

      if (existingRows.length > 0) {
        return interaction.editReply({
          content: `A deckbuilder named "${existingRows[0].deckbuilder_name}" already exists.`
        });
      }

      const [result] = await db.query(
        `INSERT INTO deckbuilders
          (deckbuilder_name, color, userID, aliases, numb_of_decks)
         VALUES (?, ?, ?, ?, ?)`,
        [deckbuilderName, color, user.id, aliases || null, deckCount]
      );

      const row = {
        id: result.insertId,
        deckbuilder_name: deckbuilderName,
        color,
        userID: user.id,
        aliases,
        numb_of_decks: deckCount
      };

      let logMessage = "";
      try {
        await sendDeckbuilderLog(interaction.client, row, interaction.user);
      } catch (logError) {
        console.error("Failed to send deckbuilder log:", logError);
        logMessage = " The deckbuilder was added, but I could not send the log message.";
      }

      return interaction.editReply({
        content: `Added deckbuilder "${deckbuilderName}" to the database.${logMessage}`
      });
    } catch (error) {
      console.error("Error adding deckbuilder:", error);
      return interaction.editReply({
        content: "An error occurred while adding the deckbuilder."
      });
    }
  }
};
