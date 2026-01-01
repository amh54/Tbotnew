const { EmbedBuilder } = require('discord.js');
async function executeCommand(command, client, message, args) {
    try {
        await command.run(client, message, args);
    } catch (e) {
        console.error('Command execution error:', e);
        try {
            const errEmbed = new EmbedBuilder()
                .setTitle("❌ | Error")
                .setColor("Red")
                .setDescription(`An error occured while running the command.\n\`\`\`ansi\n${e}\`\`\``);
            
            if (message.channel) {
                await message.channel.send({ embeds: [errEmbed] });
            }
        } catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
    }
}
module.exports = executeCommand;