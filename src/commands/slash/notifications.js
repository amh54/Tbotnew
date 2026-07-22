const { SlashCommandBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const {
  buildNotificationRoleEmbed,
  buildNotificationRoleSelectMenu,
} = require("../../features/misc/notificationRoles.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notifications")
    .setDescription("Choose which notification roles you want to receive"),
  async execute(interaction) {
    const embed = buildNotificationRoleEmbed();
    const selectMenu = buildNotificationRoleSelectMenu();
    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};
