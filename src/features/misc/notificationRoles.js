const { EmbedBuilder, MessageFlags, RoleSelectMenuBuilder } = require("discord.js");
const { ownerId, guildId} = require("../../../config.json");

const NOTIFICATION_ROLE_NAMES = ["tbotping", "tbotyt", "tbottwitch"];

function buildNotificationRoleEmbed() {
  const roleList = NOTIFICATION_ROLE_NAMES.map((name) => `**${name}**`).join(", ");

  return new EmbedBuilder()
    .setColor("Blurple")
    .setTitle("Notification Roles")
    .setDescription(
      "Choose which notification roles you want on your account. The roles listed below can be used for updates and announcements.\n\nAvailable roles: " +
        roleList
    )
    .setFooter({
      text: "Select the roles you want, then submit your choices to update your preferences.",
    });
}

function buildNotificationRoleSelectMenu() {
  return new RoleSelectMenuBuilder()
    .setCustomId("notification-role-select")
    .setPlaceholder("Select your notification roles")
    .setMinValues(0)
    .setMaxValues(NOTIFICATION_ROLE_NAMES.length);
}

async function getAvailableNotificationRoles(guild) {
  const roles = await guild.roles.fetch();
  return roles.filter((role) =>
    NOTIFICATION_ROLE_NAMES.includes(role.name.toLowerCase())
  );
}

async function handleNotificationRoleSelection(interaction) {
  if (!interaction.inGuild() || !interaction.member) {
    return interaction.reply({
      content: "This menu can only be used inside a server.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.guild.id !== guildId) {
    return interaction.reply({
      content: "This menu is only available in the tbot server.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const availableRoles = await getAvailableNotificationRoles(interaction.guild);
  if (!availableRoles.size) {
    return interaction.reply({
      content:
        "I could not find any notification roles in this server. Please make sure the roles exist and try again.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const selectedRoleIds = interaction.values || [];
  const availableRoleIds = new Set(availableRoles.map((role) => role.id));
  const eligibleRoleIds = Array.from(availableRoleIds);

  const rolesToAdd = selectedRoleIds.filter((id) => eligibleRoleIds.includes(id));
  const rolesToRemove = eligibleRoleIds.filter(
    (id) => !selectedRoleIds.includes(id) && interaction.member.roles.cache.has(id)
  );

  if (rolesToAdd.length) {
    await interaction.member.roles.add(rolesToAdd);
  }

  if (rolesToRemove.length) {
    await interaction.member.roles.remove(rolesToRemove);
  }

  const selectedRoleNames = interaction.guild.roles.cache
    .filter((role) => selectedRoleIds.includes(role.id))
    .map((role) => role.name);

  const summary = selectedRoleNames.length
    ? `You are now subscribed to: ${selectedRoleNames.join(", ")}.`
    : "You have cleared your notification role selections.";

  const statusEmbed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Notification Roles Updated")
    .setDescription(summary)
    .setFooter({ text: "You can update your choices again later if needed." });

  return interaction.reply({
    embeds: [statusEmbed],
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  NOTIFICATION_ROLE_NAMES,
  buildNotificationRoleEmbed,
  buildNotificationRoleSelectMenu,
  handleNotificationRoleSelection,
};
