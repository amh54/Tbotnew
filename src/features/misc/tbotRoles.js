const {
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} = require("discord.js");

const { guildId } = require("../../../config.json");

const TBOT_ROLES = [
  {
    name: "tbot ping",
    emoji: "🔔",
    description: "Receive important Tbot notifications and announcements.",
  },
  {
    name: "tbot yt",
    emoji: { id: "1558316910779572374" },
    description: "Get notified when new Tbot YouTube videos are posted.",
  },
  {
    name: "tbot twitch",
    emoji: { id: "1558317054451519511" },
    description: "Get notified when Tbot goes live on Twitch.",
  },
  {
    name: "tbot polls",
    emoji: "📊",
    description: "Receive notifications for Tbot polls.",
  },
  {
    name: "new deck",
    emoji: "🆕",
    description: "Get notified when a new deck is added to Tbot.",
  },
  {
    name: "deck update",
    emoji: "🔄",
    description: "Get notified when a deck is updated.",
  },
  {
    name: "deckbuilders ping",
    emoji: "🔔",
    description: "Get notified for new and deleted deckbuilders",
  },
  {
    name: "deleted deck",
    emoji: "🗑️",
    description: "Get notified when a deck is deleted.",
  },
  {
    name: "web updates",
    emoji: "🌐",
    description: "Get notified about Tbot website updates and new features.",
  },
];

const TBOT_ROLE_NAMES = TBOT_ROLES.map((role) => role.name);

function buildTbotRoleEmbed() {
  return new EmbedBuilder()
    .setColor("#8fe38b")
    .setTitle("Tbot - Role Selection")
    .setDescription(
      "Choose which Tbot notifications you want to receive.\n" +
        "Select one or more roles from the dropdown to toggle them on or off.\n" +
        "Selecting a role adds it if you don't have it, or removes it if you already have it.",
    );
}

async function getAvailableTbotRoles(guild) {
  if (!guild) {
    throw new Error("getAvailableTbotRoles: guild was not provided.");
  }

  const roles = await guild.roles.fetch();

  return roles.filter((role) =>
    TBOT_ROLE_NAMES.some(
      (name) => name.toLowerCase() === role.name.toLowerCase(),
    ),
  );
}


async function buildTbotRoleSelectMenu(guild) {
  const availableRoles = await getAvailableTbotRoles(guild);

  const options = TBOT_ROLES.map((tbotRole) => {
    const role = availableRoles.find(
      (availableRole) =>
        availableRole.name.toLowerCase() === tbotRole.name.toLowerCase(),
    );

    if (!role) {
      return null;
    }

    return {
      label: role.name,
      value: role.id,
      description: tbotRole.description,
      emoji: tbotRole.emoji,
    };
  }).filter(Boolean);

  if (!options.length) {
    throw new Error(`No Tbot roles were found in guild ${guild.id}.`);
  }

  return new StringSelectMenuBuilder()
    .setCustomId("tbot_roles")
    .setPlaceholder("Choose your Tbot roles...")
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);
}



async function handleTbotRoleSelection(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({
      content: "This menu can only be used inside a server.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.guild.id !== guildId) {
    return interaction.reply({
      content: "This menu is only available in the Tbot server.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    const availableRoles = await getAvailableTbotRoles(guild);
    const allowedRoleIds = new Set(availableRoles.map((role) => role.id));

    const selectedRoleIds = [...new Set(interaction.values)].filter((roleId) =>
      allowedRoleIds.has(roleId),
    );

    if (!selectedRoleIds.length) {
      return interaction.editReply(
        "No roles were selected, so your roles haven't been changed.",
      );
    }

    const botMember = await guild.members.fetchMe();

    if (!botMember.permissions.has("ManageRoles")) {
      return interaction.editReply(
        "I cannot update your roles because I do not have the **Manage Roles** permission.",
      );
    }

    const selectedRoles = selectedRoleIds.map((roleId) =>
      availableRoles.get(roleId),
    );

    const unmanageableRoles = selectedRoles.filter(
      (role) => !role?.editable,
    );

    if (unmanageableRoles.length) {
      return interaction.editReply(
        "I cannot manage the selected roles. Please ensure my highest role is above them in Server Settings → Roles.",
      );
    }

    const roleChanges = await Promise.all(
      selectedRoleIds.map(async (roleId) => {
        const role = availableRoles.get(roleId);

        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);

          return {
            type: "removed",
            name: role.name,
          };
        }

        await member.roles.add(roleId);

        return {
          type: "added",
          name: role.name,
        };
      }),
    );

    const added = roleChanges
      .filter((change) => change.type === "added")
      .map((change) => change.name);

    const removed = roleChanges
      .filter((change) => change.type === "removed")
      .map((change) => change.name);

    const responseSections = [];

    if (added.length) {
      responseSections.push(
        "**Roles Added**\n" + added.map((name) => `${name}`).join("\n"),
      );
    }

    if (removed.length) {
      responseSections.push(
        "**Roles Removed**\n" + removed.map((name) => `${name}`).join("\n"),
      );
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("#8fe38b")
          .setTitle("Tbot Roles Updated")
          .setDescription(responseSections.join("\n\n"))
          .setFooter({
            text: "Only the roles you selected were changed.",
          }),
      ],
    });
  } catch (error) {
    console.error("Failed to update Tbot roles:", error);

    return interaction.editReply(
      "I couldn't update your roles. Please check the bot's permissions and try again.",
    );
  }
}


module.exports = {
  TBOT_ROLE_NAMES,
  TBOT_ROLES,
  buildTbotRoleEmbed,
  buildTbotRoleSelectMenu,
  getAvailableTbotRoles,
  handleTbotRoleSelection,
};
