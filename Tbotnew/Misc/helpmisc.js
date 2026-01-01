const {EmbedBuilder} = require("discord.js")
module.exports = {
	name: `helpmisc`,
	aliases: [`misccommands`, `commandsmisc`, `mischelp`, `misc`, `miscellaneous`, `miscellaneoushelp`, `helpmiscellaneous`],
	category: `Miscellaneous`, 
			run: async(client, message, args) => {
				const Ccommands = Array.from(client.commands.values())
		const commands = Ccommands.filter((command) => {
			 if(command.category === "Miscellaneous"){
				return command.name;
			 }
		})
const toBuildString = "";
for (const command of commands) {
	toBuildString += `\n<@1043528908148052089> **${command.name}**`;
}
				const embed = new EmbedBuilder() 
				.setTitle("Help Miscellaneous Commands")
				.setDescription(`My Miscellaneous commands are ${toBuildString}
Note: There are ${commands.length} total miscellaneous commands in Tbot`)
				
	message.channel.send({embeds: [ embed ] } ) 
			}
}