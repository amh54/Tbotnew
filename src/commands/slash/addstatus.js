const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags
} = require("discord.js");

const { ownerId } = require("../../../config.json");

const STATUS_LOG_THREAD_ID = "1552699703580164229";

async function sendStatusLog(client, status, creator, addedBy) {
  const thread = await client.channels
    .fetch(STATUS_LOG_THREAD_ID)
    .catch(() => null);

  if (!thread) {
    throw new Error(
      `Unable to fetch status log thread: ${STATUS_LOG_THREAD_ID}`,
    );
  }

  const embed = new EmbedBuilder()
    .setTitle("Custom Status Added")
    .setColor("Random")
    .addFields(
      {
        name: "Status",
        value: status,
        inline: false,
      },
      {
        name: "Creator",
        value: `${creator}`,
        inline: true,
      },
      {
        name: "Added By",
        value: `${addedBy}`,
        inline: true,
      },
    )
    .setThumbnail(creator.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await thread.send({
    embeds: [embed],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addstatus")
    .setDescription("Add a custom Tbot status (Owner only)")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("The custom status to add")
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName("creator")
        .setDescription("The server member who created the status")
        .setRequired(true),
    ),

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

    const status = interaction.options.getString("status").trim();
    const creator = interaction.options.getUser("creator");

    if (!status) {
      return interaction.editReply({
        content: "Status cannot be blank.",
      });
    }

    try {
      const existingResult = await db.query(
        `
        SELECT id, status, creator
        FROM customstatus
        WHERE status = $1
        LIMIT 1
        `,
        [status],
      );

      if (existingResult.rows.length > 0) {
        return interaction.editReply({
          content: `That status already exists:\n> ${existingResult.rows[0].status}`,
        });
      }

      const insertResult = await db.query(
        `
        INSERT INTO customstatus
          (status, creator)
        VALUES ($1, $2)
        RETURNING id, status, creator
        `,
        [status, creator.username],
      );

      const row = insertResult.rows[0];

      let logMessage = "";

      try {
        await sendStatusLog(
          interaction.client,
          row.status,
          creator,
          interaction.user,
        );
      } catch (logError) {
        console.error("Failed to send custom status log:", logError);

        logMessage =
          " The status was added, but I could not send the log message.";
      }

      return interaction.editReply({
        content: `Added custom status:\n> ${row.status}\n> Creator: ${creator}${logMessage}`,
      });
    } catch (error) {
      console.error("Error adding custom status:", error);

      return interaction.editReply({
        content: "An error occurred while adding the custom status.",
      });
    }
  },
};