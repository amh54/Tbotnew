const {
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const { ownerId } = require("../../../config.json");

const STATUS_LOG_THREAD_ID = "1552699703580164229";

async function sendStatusLog(client, interaction, row, removedBy) {
  const thread = await client.channels
    .fetch(STATUS_LOG_THREAD_ID)
    .catch(() => null);

  if (!thread) {
    throw new Error(
      `Unable to fetch status log thread: ${STATUS_LOG_THREAD_ID}`,
    );
  }

  let creatorMember = null;

  if (interaction.guild) {
    creatorMember =
      interaction.guild.members.cache.find(
        (member) =>
          member.user.username.toLowerCase() ===
          (row.creator || "").toLowerCase(),
      ) || null;
  }

  const embed = new EmbedBuilder()
    .setTitle("Custom Status Removed")
    .setColor("Random")
    .addFields(
      {
        name: "Status",
        value: row.status,
        inline: false,
      },
      {
        name: "Creator",
        value: row.creator || "Unknown",
        inline: true,
      },
      {
        name: "Removed By",
        value: `${removedBy}`,
        inline: true,
      },
    )
    .setTimestamp();

  if (creatorMember) {
    embed.setThumbnail(creatorMember.user.displayAvatarURL({ size: 256 }));
  }

  await thread.send({
    embeds: [embed],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removestatus")
    .setDescription("Remove a custom Tbot status (Owner only)")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Search for the custom status to remove")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.respond([]);
    }

    const db = require("../../../index.js");

    const search = interaction.options.getString("status") || "";

    try {
      const result = await db.query(
        `
        SELECT id, status, creator
        FROM customstatus
        WHERE status ILIKE $1
        ORDER BY id DESC
        LIMIT 25
        `,
        [`%${search}%`],
      );

      return interaction.respond(
        result.rows.map((row) => ({
          name: row.status.slice(0, 100),
          value: String(row.id),
        })),
      );
    } catch (error) {
      console.error("Error searching custom statuses:", error);

      return interaction.respond([]);
    }
  },

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({
  flags: MessageFlags.Ephemeral,
});

    const db = require("../../../index.js");

    const statusId = interaction.options.getString("status");

    if (!statusId) {
      return interaction.editReply({
        content: "Please select a status to remove.",
      });
    }

    try {
      const result = await db.query(
        `
        DELETE FROM customstatus
        WHERE id = $1
        RETURNING id, status, creator
        `,
        [statusId],
      );

      if (result.rows.length === 0) {
        return interaction.editReply({
          content: "That custom status could not be found.",
        });
      }

      const row = result.rows[0];

      let logMessage = "";

      try {
        await sendStatusLog(
          interaction.client,
          interaction,
          row,
          interaction.user,
        );
      } catch (logError) {
        console.error("Failed to send custom status removal log:", logError);

        logMessage =
          " The status was removed, but I could not send the log message.";
      }

      return interaction.editReply({
        content: `Removed custom status:\n> ${row.status}\n> Creator: ${row.creator || "Unknown"}${logMessage}`,
      });
    } catch (error) {
      console.error("Error removing custom status:", error);

      return interaction.editReply({
        content: "An error occurred while removing the custom status.",
      });
    }
  },
};