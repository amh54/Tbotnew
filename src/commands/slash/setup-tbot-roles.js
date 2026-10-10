
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");

const {
  buildTbotRoleEmbed,
  buildTbotRoleSelectMenu,
} = require("../../features/misc/tbotRoles.js");

const { ownerId } = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-tbot-roles")
    .setDescription("Post the Tbot role selection menu"),

  async execute(interaction) {
   if (interaction.user.id !== ownerId) {
  return interaction.reply({
    content: "Only the bot owner can use this command.",
    flags: MessageFlags.Ephemeral,
  });
}

    try {
      const menu = await buildTbotRoleSelectMenu(
        interaction.guild
      );

      await interaction.channel.send({
        embeds: [buildTbotRoleEmbed()],
        components: [
          new ActionRowBuilder().addComponents(menu),
        ],
      });

      await interaction.reply({
        content: "Tbot's role selection menu has been posted.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Failed to post Tbot role menu:", error);

      const response = {
        content: "Failed to post the Tbot role menu. Check the bot logs.",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
      } else {
        await interaction.reply(response);
      }
    }
  },
};
