const { SlashCommandBuilder } = require("discord.js");
const { buildMessageFromInteraction } = require("../../Utilities/interactionMessageAdapter.js");

const miscCommands = {
  aboutme: require("../../Misc/aboutme.js"),
  adddeck: require("../../Misc/adddeck.js"),
  discord: require("../../Misc/discord.js"),
  donate: require("../../Misc/donate.js"),
  flip: require("../../Misc/flip.js"),
  hang: require("../../Misc/hang.js"),
  herowheel: require("../../Misc/herowheel.js"),
  tourneys: require("../../Misc/tourneys.js"),
  vote: require("../../Misc/vote.js"),
  zombieleap: require("../../Misc/zombieleap.js")
};

const builder = new SlashCommandBuilder()
  .setName("miscellaneous")
  .setDescription("Miscellaneous Tbot commands")
  .addStringOption((option) =>
    option
      .setName("command")
      .setDescription("Select a misc command")
      .setRequired(true)
      .addChoices(
        { name: "About Tbot", value: "aboutme" },
        { name: "Deck submission guidelines", value: "adddeck" },
        { name: "Tbot Discord invite", value: "discord" },
        { name: "Support Tbot", value: "donate" },
        { name: "Flip a coin", value: "flip" },
        { name: "Play hangman", value: "hang" },
        { name: "Random hero wheel", value: "herowheel" },
        { name: "PVZH tournament servers", value: "tourneys" },
        { name: "Vote for Tbot", value: "vote" },
        { name: "Zombie leap list", value: "zombieleap" }
      )
  );

module.exports = {
  data: builder,
  async execute(interaction) {
    const selected = interaction.options.getString("command");
    const command = miscCommands[selected];
    if (!command) return;

    const message = buildMessageFromInteraction(interaction);
    return command.run(interaction.client, message, []);
  }
};
