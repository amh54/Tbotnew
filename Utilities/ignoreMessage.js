function ignoreMessage(message, client) {
    const prefix = "?";
    const botMentionInContent = new RegExp(`<@!?${client.user.id}>`).test(message.content);
    const isReplyToBot = message.reference && message.mentions.repliedUser?.id === client.user.id;
    const isReplyWithoutMention = isReplyToBot && !botMentionInContent;
    
    const botMentioned = botMentionInContent;
    const usesPrefix = message.content.toLowerCase().startsWith(prefix);

    if (!usesPrefix && !botMentioned) return true;
    if (isReplyWithoutMention) return true;
    
    return false;
}
module.exports = ignoreMessage;