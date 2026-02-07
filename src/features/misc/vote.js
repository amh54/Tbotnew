const {EmbedBuilder} = require("discord.js")
module.exports = {
	name: `vote`,
	aliases: [`voting`, `votefortbot`],
	category: `Miscellaneous`,
	run: async(client, message, args) => {
		if(message.guild.id == "285818469960646657") return message.author.send("This command is disabled in this server please use it in another server")
			else{
		const vote = new EmbedBuilder()
		.setTitle("Vote for tbot")
		.setDescription("You can vote for tbot below with these link voting and leave reviews on these sites will help the bot get noticed and allow more people to held find the great bot to add it to their server. \n You can also get inv links for the bot here with the add to server buttons \n Some of these places also have way of getting your bots certified with how many votes they get and how many servers they are in so this is a great way to support tbot.")
		.addFields({
								name: "Top.gg", 
								value: "https://top.gg/bot/1043528908148052089"
							 },
							 {name: "Botlist.me", 
								value: "https://botlist.me/bots/1043528908148052089"
							 },
							 {
								 name: "bhbbotlist",			
								 value:"https://bhbotlist.tech/bot/1043528908148052089"
							 }
							)
		.setColor("Random")
		.setFooter({text: "Thank you for voting for tbot today <:Worryheart:821732059348336690>"})
		message.channel.send({embeds: [ vote ] } )
	}
		
		
	}
}