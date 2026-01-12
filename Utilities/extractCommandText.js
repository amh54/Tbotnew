function extractCommandText(message, client) {
    const prefix = "?";
    const usesPrefix = message.content.toLowerCase().startsWith(prefix);
    const botMentionInContent = new RegExp(`<@!?${client.user.id}>`).test(message.content);
    
    if (usesPrefix) {
        return message.content.slice(prefix.length).trim();
    } else if (botMentionInContent) {
        return message.content
            .replaceAll(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
            .trim();
    }
    return "";
}
module.exports = extractCommandText;