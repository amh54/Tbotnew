module.exports = {
	name: `flip`,
	aliases: [`coinflip`, `coin`, `flipacoin`, `cointoss`],
	category: `Miscellaneous`,
	run: async(client, message, args) => {
		const flip = ["Heads", "Tails"]
		 message.channel.send(flip[Math.floor(Math.random() * flip.length)]);
	}
}