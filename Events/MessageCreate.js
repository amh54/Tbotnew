const { Events } = require('discord.js');
const prefix = "?";
const handleCommandNotFound = require("../Utilities/handleCommandNotFound");
const checkMessagePermissions = require("../Utilities/checkMessagePermissions");
const executeCommand = require("../Utilities/executeCommand");
const { findClosestCardName } = require("../Utilities/spellChecker");
const sanitizeCommandName = require("../Utilities/sanitizeCommandName");

module.exports = {
    name: Events.MessageCreate,
    async run(message) {
        if (message.author.bot && message.author.id != "1043528908148052089") return;

        const client = message.client;
        const channel = client.channels.cache.get("1050107020008771604");
        const botMentionInContent = new RegExp(`<@!?${client.user.id}>`).test(message.content);
        const isReplyToBot = message.reference && message.mentions.repliedUser?.id === client.user.id;
        const isReplyWithoutMention = isReplyToBot && !botMentionInContent;
        
        const botMentioned = botMentionInContent;
        const usesPrefix = message.content.toLowerCase().startsWith(prefix);

        if (!usesPrefix && !botMentioned) return;
        if (isReplyWithoutMention) return;

        let commandText = "";
        if (usesPrefix) {
            commandText = message.content.slice(prefix.length).trim();
        } else if (botMentioned) {
            commandText = message.content
                .replaceAll(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
                .trim();
        }

        if (!commandText) return;

        const args = commandText.split(/ +/g);
        const originalInput = commandText.toLowerCase();
        const invoked = commandText.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
        let command = client.commands.get(invoked) || client.commands.find((a) => a.aliases?.includes(invoked));

        if (!command) {
            let closestCardName = await findClosestCardName(originalInput, 70);
            if (!closestCardName) {
                closestCardName = await findClosestCardName(originalInput, 60);
            }
            if (closestCardName) {
                const sanitizedCardName = sanitizeCommandName(closestCardName);
                command = client.commands.get(sanitizedCardName) || client.commands.find((a) => a.aliases?.includes(sanitizedCardName));
            }
        }

        if (handleCommandNotFound(command, message, channel)) return;
        if (message.guild && !checkMessagePermissions(message, channel)) return;
        await executeCommand(command, client, message, args);
    }
};