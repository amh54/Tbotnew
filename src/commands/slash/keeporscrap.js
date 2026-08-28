const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const keepOrScrapFeature = require("../../features/misc/keeporscrap.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("keeporscrap")
    .setDescription("View Keep or Scrap tiers")
    .addStringOption((option) =>
      option
        .setName("side")
        .setDescription("Choose which part of the guide to view")
        .setRequired(true)
        .addChoices(
          {
            name: "Intro/Explanation",
            value: "intro",
          },
          {
            name: "Plants",
            value: "plants",
          },
          {
            name: "Zombies",
            value: "zombies",
          },
        ),
    ),

  async execute(interaction) {
    try {
      const side = interaction.options.getString("side");

      const { introContainers, plantContainers, zombieContainers } =
        await keepOrScrapFeature.buildKeepOrScrapContainers(interaction.client);

      /*
       * Select ONLY the containers belonging to
       * the option the user selected.
       */
      let containers = [];

      switch (side) {
        case "intro":
          containers = introContainers;
          break;

        case "plants":
          containers = plantContainers;
          break;

        case "zombies":
          containers = zombieContainers;
          break;

        default:
          containers = [];
          break;
      }

      if (!containers || containers.length === 0) {
        return interaction.reply({
          content: "❌ No Keep or Scrap data was found for that section.",
          flags: MessageFlags.Ephemeral,
        });
      }

      /*
       * The first container acknowledges the slash command.
       */
      await interaction.reply({
        components: [containers[0]],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
          parse: [],
        },
      });

      /*
       * If the selected section needs multiple messages
       * because of Discord's 4000-character limit,
       * send ONLY the remaining containers for that
       * selected section.
       *
       * Example:
       *
       * /keeporscrap side:intro
       *
       * sends:
       *   Intro container 1
       *   Intro container 2
       *   Intro container 3
       *
       * It does NOT send Plants or Zombies.
       */
      for (let i = 1; i < containers.length; i++) {
        await interaction.channel.send({
          components: [containers[i]],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            parse: [],
          },
        });
      }
    } catch (error) {
      console.error("Error executing command: keeporscrap", error);

      /*
       * Do not call interaction.reply() a second time
       * after the interaction has already been acknowledged.
       */
      if (interaction.replied || interaction.deferred) {
        try {
          await interaction.editReply({
            content:
              "❌ An error occurred while loading the Keep or Scrap list.",
            components: [],
          });
        } catch (editError) {
          console.error("Could not edit Keep or Scrap error reply:", editError);
        }

        return;
      }

      try {
        await interaction.reply({
          content: "❌ An error occurred while loading the Keep or Scrap list.",
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        console.error("Could not send Keep or Scrap error reply:", replyError);
      }
    }
  },
};
