const {
  EmbedBuilder,
  resolveColor,
  SlashCommandBuilder
} = require("discord.js");
const { ownerId } = require("../../../config.json");
const {
  getDeckbuilderAutocompleteResults,
  resolveDeckbuilderName
} = require("../../features/decks/deckbuilderAutocomplete.js");

const DECKBUILDER_LOG_THREAD_ID = "1516609490743464107";

function safeEmbedColor(color) {
  const trimmed = (color || "").trim();
  if (!trimmed) return "Red";

  try {
    resolveColor(trimmed);
    return trimmed;
  } catch {
    return "Red";
  }
}

function formatUser(userId) {
  return userId ? `<@${userId}>` : "N/A";
}

async function sendDeckbuilderDeleteLog(client, row, deletedBy) {
  const thread = await client.channels.fetch(DECKBUILDER_LOG_THREAD_ID).catch(() => null);
  if (!thread) {
    throw new Error(`Unable to fetch deckbuilder log thread: ${DECKBUILDER_LOG_THREAD_ID}`);
  }

  const user = row.userID ? await client.users.fetch(row.userID).catch(() => null) : null;
  const embed = new EmbedBuilder()
    .setTitle(`${row.deckbuilder_name} deleted as deckbuilder`)
    .setColor(safeEmbedColor(row.color))
    .addFields(
      { name: "Deckbuilder", value: row.deckbuilder_name || "N/A", inline: true },
      { name: "Discord User", value: formatUser(row.userID), inline: true },
      { name: "Color", value: row.color || "N/A", inline: true }
    )
    .setFooter({ text: `Deleted by ${deletedBy.tag}` })
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
    .setName("deletedeckbuilder")
    .setDescription("Delete a deckbuilder from the Tbot database (Owner only)")
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
      const results = await getDeckbuilderAutocompleteResults(db, focusedValue);
      await interaction.respond(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "You do not have permission to use this command."
      });
    }

    await interaction.deferReply();

    const db = require("../../../index.js");
    const deckbuilderInput = interaction.options.getString("name").trim();
    const deckbuilderName = (await resolveDeckbuilderName(db, deckbuilderInput)) || deckbuilderInput;

    try {
      const [rows] = await db.query(
        "SELECT * FROM deckbuilders WHERE deckbuilder_name = ? LIMIT 1",
        [deckbuilderName]
      );

      if (!rows || rows.length === 0) {
        return interaction.editReply({
          content: `No deckbuilder found with the name "${deckbuilderName}".`
        });
      }

      const deckbuilder = rows[0];

      await db.query(
        "DELETE FROM deckbuilders WHERE id = ? LIMIT 1",
        [deckbuilder.id]
      );

      let logMessage = "";
      try {
        await sendDeckbuilderDeleteLog(interaction.client, deckbuilder, interaction.user);
      } catch (logError) {
        console.error("Failed to send deckbuilder delete log:", logError);
        logMessage = " The deckbuilder was deleted, but I could not send the log message.";
      }

      return interaction.editReply({
        content: `Deleted deckbuilder "${deckbuilder.deckbuilder_name}" from the database.${logMessage}`
      });
    } catch (error) {
      console.error("Error deleting deckbuilder:", error);
      return interaction.editReply({
        content: "An error occurred while deleting the deckbuilder."
      });
    }
  }
};
