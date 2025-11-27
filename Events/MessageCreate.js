const {Events} = require('discord.js');
const prefix = "?";
const handleCommandNotFound = require("../Utilities/handleCommandNotFound");
const checkMessagePermissions = require("../Utilities/checkMessagePermissions");
const executeCommand = require("../Utilities/executeCommand");

module.exports ={
    name: Events.MessageCreate,
    async run(message) {
        if (!message.content.toLowerCase().startsWith(prefix)) return;
        if (message.author.bot && message.author.id != "1043528908148052089") return;

        const client = message.client;
        const channel = client.channels.cache.get("1050107020008771604");
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const invokedRaw = args.join("").toLowerCase();
        const invoked = invokedRaw.replaceAll(/[^a-z0-9]+/g, ""); 
        const command = client.commands.get(invoked) || client.commands.find((a) => a.aliases?.includes(invoked));
        if (handleCommandNotFound(command, message, channel)) return;
        if (message.guild && !checkMessagePermissions(message, channel)) return;
        await executeCommand(command, client, message, args);
    }
}