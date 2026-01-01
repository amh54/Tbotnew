const { PermissionsBitField } = require('discord.js');
function checkMessagePermissions(message, channel) {
    if (!message.guild) return true;
    const hasPermission = message.guild.members.me
        .permissionsIn(message.channel)
        .has(PermissionsBitField.Flags.SendMessages);
    if (!hasPermission) {
        if (channel) {
            channel.send(`I do not have permission to send messages in this channel. ${message.guild.name}, ${message.channel.name}, <#${message.channel.id}>`);
        } else {
            console.log(`No permission to send in ${message.guild.name}, ${message.channel.name}`);
        }
        return false;
    }
    return true;
}
module.exports = checkMessagePermissions;