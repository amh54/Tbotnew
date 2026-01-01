const {
    ContainerBuilder, 
    SectionBuilder,
    TextDisplayBuilder,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
}= require('discord.js');
module.exports = {
    name: `discord`, 
    aliases: [`discordserver`, `tbotdiscord`, `tbotserver`, `joinserver`],
    category: `Miscellaneous`,
    run: async(client, message, args) => {
        const container = new ContainerBuilder()
        const guideText = new TextDisplayBuilder().setContent([
            "# Join the Tbot Discord Server!",
            "If you would like to join the Tbot Discord server, please click on the Tbot Discord button!",
            "In the server, you can get help with Tbot, check in with your deck suggestion from </submitdeck:1394802186659168446>, or suggest new features or ideas not explored in Tbot yet",
            "or you can chat with other Tbot users!",
            "You will also be able to stay up to date with the latest Tbot news and updates whether that be new decks, commands, or features that have been added to the bot!",
            "We would love to have you join our community!",
        ].join('\n'));
        const guideButton = new ButtonBuilder()
            .setLabel('Join Tbot Discord')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/2NSwt96vmS')
            .setEmoji('💬')
        const section1 = new SectionBuilder().addTextDisplayComponents(guideText).setButtonAccessory(guideButton);
        container.addSectionComponents(section1);
        message.channel.send({components: [container], flags: MessageFlags.IsComponentsV2})
    }
}