function handleCommandNotFound(command, message, channel) {
    if (!command && message.channel.id != "1050107020008771604") {
        if (channel) {
            channel.send(`\`${message.content}\` is not a command sent by ${message.author.username}.`);
        } else {
            console.log(`Command not found: ${message.content} sent by ${message.author.username}`);
        }
        return true;
    }
    return !command;
}
module.exports = handleCommandNotFound;