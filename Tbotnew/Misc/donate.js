const { ButtonBuilder, ButtonStyle,  ContainerBuilder,
    SectionBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
module.exports = {
    name: `donate`, 
    aliases: [`donatetobot`, `donatetbot`],
    category: `Miscellaneous`,
    run: async(client, message, args) => {
        const container = new ContainerBuilder()
        const donateText = new TextDisplayBuilder().setContent([
            "# Want to support tbot development?",
            "If you want to donate to the bot, you can do so by clicking the donate button!",
            "Donations help with server costs and development time.",
            "Note this is **not required**, but it is appreciated!",
        ].join('\n'));
        const donateButton = new ButtonBuilder()
            .setLabel('Donate to tbot')
            .setStyle(ButtonStyle.Link)
            .setURL('https://buymeacoffee.com/tbotpvzh')
            .setEmoji('☕')
        const section1 = new SectionBuilder().addTextDisplayComponents(donateText).setButtonAccessory(donateButton);
        container.addSectionComponents(section1);
        message.channel.send({components: [container], flags: MessageFlags.IsComponentsV2})
    }
}