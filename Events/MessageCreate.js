const { Events } = require('discord.js');
const handleCommandNotFound = require("../Utilities/handleCommandNotFound");
const checkMessagePermissions = require("../Utilities/checkMessagePermissions");
const executeCommand = require("../Utilities/executeCommand");
const ignoreMessage = require("../Utilities/ignoreMessage");
const extractCommandText = require("../Utilities/extractCommandText");
const findCommand = require("../Utilities/findCommand");

module.exports = {
    name: Events.MessageCreate,
    async run(message) {
        if (message.author.bot && message.author.id != "1043528908148052089") return;

        const client = message.client;
        const channel = client.channels.cache.get("1050107020008771604");

        if (ignoreMessage(message, client)) return;

        const commandText = extractCommandText(message, client);
        if (!commandText) return;

        const args = commandText.split(/ +/g);
        const command = await findCommand(client, commandText);

        if (handleCommandNotFound(command, message, channel)) return;
        if (message.guild && !checkMessagePermissions(message, channel)) return;
        await executeCommand(command, client, message, args);
    }
};