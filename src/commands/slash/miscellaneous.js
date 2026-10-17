const { SlashCommandBuilder } = require("discord.js");
const { buildMessageFromInteraction } = require("../../lib/discord/interactionMessageAdapter.js");

const miscCommands = {
  aboutme: require("../../features/misc/aboutme.js"),
  deckbuilders: require("../../features/misc/deckbuilders.js"),
  deckguidelines: require("../../features/misc/deckguidelines.js"),
  discord: require("../../features/misc/discord.js"),
  donate: require("../../features/misc/donate.js"),
  flip: require("../../features/misc/flip.js"),
  hang: require("../../features/misc/hang.js"),
  discord_servers: require("../../features/misc/discord_servers.js"),
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
        {name: "All Deckbuilders", value: "deckbuilders"},
        { name: "Deck submission guidelines", value: "deckguidelines" },
        { name: "Tbot Discord invite", value: "discord" },
        { name: "Support Tbot", value: "donate" },
        { name: "Flip a coin", value: "flip" },
        { name: "Play hangman", value: "hang" },
        { name: "PVZH servers", value: "discord_servers" },
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
