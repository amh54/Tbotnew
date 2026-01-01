const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { hangmanGuesses, randomWord, ascii } = require('../Utilities/hangman');
module.exports = {
    name: `hang`,
    aliases: ['hangman'],
    category: `Miscellaneous`,
    async run(client, message, args) {
        const word = randomWord();

        const wordButton = new ButtonBuilder()
            .setLabel('✏️ Guess Word')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`hangman-${word}-word`);

        const letterButton = new ButtonBuilder()
            .setLabel('🔤 Guess Letter')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`hangman-${word}-letter`)

        const row = new ActionRowBuilder({ components: [wordButton, letterButton] });
        const embed = new EmbedBuilder()
            .setTitle('Hangman')
            .setColor('Random')
            .setDescription(`\`\`\`${ascii[0]}${[...'_'.repeat(word.length)].join(' ')}\n\`\`\``)
            .addFields(
                { name: 'Guessed Words', value: '`N/A`' },
                { name: 'Guessed Letters', value: '`N/A`' },
            )
        const msg = await message.reply({
            // content: `Selected word: ${word}`,
            embeds: [embed], components: [row],
        });
        
        hangmanGuesses.set(msg.id, {
            guesses: 0,
            letters: [],
            words: [],
            word,
            unguessed: new Set(word),
            text: [...'_'.repeat(word.length)].join(' '),
        });
			console.log(word)
    },
}