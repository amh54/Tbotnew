const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const guideCommand = require("../../Misc/guide.js");

const guideChoices = [
  { name: "Overview", value: "overview" },
  { name: "Curve", value: "curve" },
  { name: "Archetypes", value: "archetypes" },
  { name: "Finishing Power", value: "finishing_power" },
  { name: "Removal and Answers", value: "removal_and_answers" },
  { name: "Superpowers and Closing Thoughts", value: "superpowers_and_closing_thoughts" },
  { name: "Glossary", value: "glossary" },
  { name: "Examples", value: "examples" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guide")
    .setDescription("Deckbuilding guide")
    .addStringOption((option) =>
      option
        .setName("section")
        .setDescription("Guide section")
        .setRequired(true)
        .addChoices(...guideChoices)
    ),
  async execute(interaction) {
    const section = interaction.options.getString("section");
    const {
      guideContainer,
      curveContainer,
      archetypesContainer,
      finishingPowerContainer,
      removalAndAnswersContainer,
      superpowersAndClosingThoughtsContainer,
      glossaryContainer,
      glossaryMedia,
      examplesContainer
    } = guideCommand.buildGuideContainers(false);

    let components = [];
    switch (section) {
      case "curve":
        components = [curveContainer];
        break;
      case "archetypes":
        components = [archetypesContainer];
        break;
      case "finishing_power":
        components = [finishingPowerContainer];
        break;
      case "removal_and_answers":
        components = [removalAndAnswersContainer];
        break;
      case "superpowers_and_closing_thoughts":
        components = [superpowersAndClosingThoughtsContainer];
        break;
      case "glossary":
        components = [glossaryContainer, glossaryMedia];
        break;
      case "examples":
        components = [examplesContainer];
        break;
      case "overview":
      default:
        components = [guideContainer];
        break;
    }

    return interaction.reply({
      components,
      flags: MessageFlags.IsComponentsV2
    });
  }
};
