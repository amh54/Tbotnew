const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8 ball a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The question you want to ask the magic 8 ball')
        .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const ball = [
            "It is certain",
            "Without a doubt",
            "You may rely on it",
            "Yes definitely",
            "It is decidedly so",
            "As I see it, yes",
            "Most likely",
            "Yes",
            "Outlook good",
            "Signs point to yes",
            "Better not tell you now",
            "Ask again later",
            "Cannot predict now",
            "Don't count on it",
            "Outlook not so good",
            "My sources say no",
            "Very doubtful"
        ];
        const embed = new EmbedBuilder()
            .setTitle(`:8ball: ${question}`)
            .setDescription(`:8ball: says ${ball[Math.floor(Math.random() * ball.length)]}`)
            .setColor("Random");
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
};