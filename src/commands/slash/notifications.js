const { SlashCommandBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const {
  buildNotificationRoleEmbed,
  buildNotificationRoleSelectMenu,
  getAvailableNotificationRoles,
} = require("../../features/misc/notificationRoles.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notifications")
    .setDescription("Choose which notification roles you want to receive"),
  async execute(interaction) {
    const embed = buildNotificationRoleEmbed();
    const availableRoles = await getAvailableNotificationRoles(interaction.guild);

    if (!availableRoles.size) {
      return await interaction.reply({
        content:
          "Use this command in the tbot server to select your notification roles.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const selectMenu = await buildNotificationRoleSelectMenu(interaction.guild);
    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};
