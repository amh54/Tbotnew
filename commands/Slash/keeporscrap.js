const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const keepOrScrapCommand = require("../../Misc/keeporscrap.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("keeporscrap")
    .setDescription("View Keep or Scrap tiers")
    .addStringOption((option) =>
      option
        .setName("side")
        .setDescription("Choose plants or zombies")
        .setRequired(true)
        .addChoices(
          { name: "Plants", value: "plants" },
          { name: "Zombies", value: "zombies" }
        )
    ),
  async execute(interaction) {
    const side = interaction.options.getString("side");
    const {
      plantContainer,
      zombieContainer
    } = await keepOrScrapCommand.buildKeepOrScrapContainers(interaction.client, false);

    const container = side === "plants" ? plantContainer : zombieContainer;
    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
