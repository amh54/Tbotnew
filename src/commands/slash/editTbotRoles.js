const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");

const { guildId } = require("../../../config.json");

const MESSAGE_ID = "1392955234787004506";

const TBOT_ROLES = [
  {
    name: "bug buster",
    emoji: "🐛",
    description: "Must have found bugs in Tbot and reported them to Tbone",
  },
  {
    name: "tbot artist",
    emoji: "🎨",
    description: "Must have made some form of art for Tbot(Banner, PFP, etc)",
  },
  {
    name: "tbot reviewer",
    emoji: "📝",
    description: "Must have wrote a review for tbot",
  },
  {
    name: "tbot supporter",
    emoji: "☕",
    description: "Must have dontated to Tbot.",
  },
  {
    name: "tbot contributor",
    emoji: "🤝",
    description: "Must have made a significant contribution to Tbot.",
  },
  {
    name: "tbot representative",
    emoji: "📝",
    description:
      "Must be someone who handle a lot of communications regarding Tbot",
  },
  {
    name: "tbot judge",
    emoji: { id: "1559003466184265800" },
    description: "Must be specifically choosen by Tbone to judge decks in Tbot",
  },
  {
    name: "tbot celebrity",
    emoji: { id: "1558316910779572374" },
    description: "Must have a YT, Twitch, Tiktok linked to your Tbot profile",
  },
  {
    name: "tbot collab",
    emoji: "🤝",
    description: "Must have collabed with Tbone",
  },
  {
    name: "tbot booster",
    emoji: { id: "1558999314984865802" },
    description: "Must have boosted the Tbot server",
  },
  {
    name: "low life swabbie",
    emoji: { id: "1559000038284333159" },
    description: "Must have reached level 5 in server",
  },
  {
    name: "young swabbie",
    emoji: { id: "1559000581866000467" },
    description: "Must have reached level 10 in server",
  },
  {
    name: "swabbie master",
    emoji: { id: "1559001258218496130" },
    description: "Must have reached level 20 in server",
  },
  {
    name: "swabbie god",
    emoji: { id: "1559001602465988688" },
    description: "Must have reached level 50 in server",
  },
  {
    name: "Zombotter",
    emoji: { id: "1559002219171287070" },
    description: "Gets Zombot from /miscellaneous Zombie leap",
  },
  {
    name: "trick botting",
    emoji: { id: "1559002852414717992" },
    description: "Gets Trickster from /miscellaneous Zombie leap",
  },
  {
    name: "my birthday",
    emoji: "🎂",
    description:
      "Must be your birthday register your birthday through the /set command",
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edittbotroles")
    .setDescription("Update the Tbot role information message"),

  async execute(interaction) {
    if (!interaction.inGuild() || interaction.guild.id !== guildId) {
      return interaction.reply({
        content: "This command can only be used in the Tbot server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.memberPermissions.has("ManageMessages")) {
      return interaction.reply({
        content: "You need the Manage Messages permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    try {
      const guild = interaction.guild;
      const channel = interaction.channel;
      const message = await channel.messages.fetch(MESSAGE_ID);
      const roles = await guild.roles.fetch();

      const availableRoles = TBOT_ROLES.map((item) => {
        const role = roles.find(
          (availableRole) =>
            availableRole.name.toLowerCase() === item.name.toLowerCase(),
        );

        if (!role) {
          return null;
        }

        return { ...item, role };
      }).filter(Boolean);

      if (!availableRoles.length) {
        throw new Error("No matching Tbot roles were found.");
      }
      const embed = new EmbedBuilder()
        .setColor("#8fe38b")
        .setTitle("RARE TBOT ROLES INFO")
        .setDescription("CLICK DROPDOWN FOR ROLE INFO BELOW⏬")
       .setThumbnail(
  "https://media.discordapp.net/attachments/1044626284346605588/1559004627457020014/levelgif.gif"
);

      const menu = new StringSelectMenuBuilder()
        .setCustomId("tbot_roles_info")
        .setPlaceholder("Choose a rare Tbot role to view its requirements...")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          availableRoles.map((item) => ({
            label: item.role.name,
            value: item.role.id,
            description: item.description,
            emoji: item.emoji,
          })),
        );

      await message.edit({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
      });

      return interaction.editReply(
        "The Tbot role information embed and disabled select menu have been updated.",
      );
    } catch (error) {
      console.error("Failed to edit Tbot role message:", error);

      return interaction.editReply(
        "Failed to update the message. Make sure it is in this channel and the bot can access it.",
      );
    }
  },
};
