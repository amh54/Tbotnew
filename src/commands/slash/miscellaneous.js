const { SlashCommandBuilder } = require("discord.js");
const { buildMessageFromInteraction } = require("../../lib/discord/interactionMessageAdapter.js");

const miscCommands = {
  aboutme: require("../../features/misc/aboutme.js"),
  adddeck: require("../../features/misc/adddeck.js"),
  discord: require("../../features/misc/discord.js"),
  donate: require("../../features/misc/donate.js"),
  flip: require("../../features/misc/flip.js"),
  hang: require("../../features/misc/hang.js"),
  tourneys: require("../../features/misc/tourneys.js"),
  vote: require("../../features/misc/vote.js"),
  zombieleap: require("../../features/misc/zombieleap.js")
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
        { name: "PVZH tournament servers", value: "tourneys" },
        { name: "Vote for Tbot", value: "vote" },
        { name: "Zombie leap", value: "zombieleap" }
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
