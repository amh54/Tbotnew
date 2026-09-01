const {
  SlashCommandBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");

const {
  buildNotificationRoleEmbed,
  buildNotificationRoleSelectMenu,
} = require("../../features/misc/notificationRoles.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notifications")
    .setDescription("Choose which notification roles you want to receive"),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.reply({
        content:
          "Use this command in the tbot server to select your notification roles.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = buildNotificationRoleEmbed();

    let selectMenu;

    try {
      selectMenu = await buildNotificationRoleSelectMenu(
        interaction.guild
      );
    } catch (error) {
      console.error(
        "Failed to build notification role menu:",
        error
      );

      return interaction.reply({
        content:
          "I could not find the notification roles in this server. Please make sure they exist and try again.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};