const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: `deckbuilders`,
  aliases: [
    `deckcreators`,
    `deckbuilder`,
    `deckcreator`,
    `deckmakers`,
    `deckmaker`,
    `builders`,
	  `creators`,
    `creator`
  ],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    const Ccommands = Array.from(client.commands.values());
    const commands = Ccommands.filter((command) => {
      if (command.category === "DeckBuilders") {
        return command.name;
      }
    });
    commands.sort((a, b) => a.name.localeCompare(b.name));
    let toBuildString = "";
    for (const command of commands) {
      toBuildString += `\n<@1043528908148052089> **${command.name}**`;
    }
    const db = new EmbedBuilder()
      .setTitle("Deck Creators in tbot")
      .setDescription(
        `My Commands for deckbuilders are ${toBuildString}
Note: There are ${commands.length} total deckbuilders in Tbot`
      )
      .setColor("Random");
    message.channel.send({ embeds: [db] });
  },
};
