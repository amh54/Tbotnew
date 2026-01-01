const {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ThumbnailBuilder,
} = require("discord.js");
module.exports = {
  name: `aboutme`,
  aliases: [`about`, `tbotinfo`, `botinfo`, `infotbot`, `info`, `tbot`, ``],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    const container = new ContainerBuilder();
    const aboutText1 = new TextDisplayBuilder().setContent(
      [
        "# About Tbot",
        "**Tbot** is a bot based around the plants vs zombies heroes card game having a lot of features and useful commands for pvzh players.",
        'As tcc quotes "a bot for everything pvzh related"',
      ].join("\n")
    );
    const tbotImage = new ThumbnailBuilder().setURL(
      client.user.displayAvatarURL()
    );
    const aboutSection1 = new SectionBuilder()
      .addTextDisplayComponents(aboutText1)
      .setThumbnailAccessory(tbotImage);
    container.addSectionComponents(aboutSection1);
    const aboutText2 = new TextDisplayBuilder().setContent(
      [
        "# Help command",
        "Use <@1043528908148052089> help to find all the commands for the bot.",
        "If you are looking for a specific hero or category you can pick out the hero or command category",
      ].join("\n")
    );
    container.addTextDisplayComponents(aboutText2);
    const aboutText3 = new TextDisplayBuilder().setContent(
      [
        "# Decks",
        "Tbot has plenty of decks stored in its database for viewing and playing with.",
        "To see decks with a **specific hero** do <@1043528908148052089> [insertherohere] and then click on the decks button.",
        "To see **every deck** in the tbot database please use the <@1043528908148052089> helpdb command.",
        "If you would like to see your deck or a specific deck added to the database please use the <@1043528908148052089> adddeck command.",
      ].join("\n")
    );
    container.addTextDisplayComponents(aboutText3);
    const aboutText4 = new TextDisplayBuilder().setContent(
      [
        "# Invite Tbot",
        "If you would like to invite Tbot to your server please click on the tbot invite button, however",
        "Tbot should not be used or invited to personal servers, Tbot is a bot that can also be used in direct messages(DMS).",
      ].join("\n")
    );
    const tbotInvite = new ButtonBuilder()
      .setLabel("Tbot Invite")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/api/oauth2/authorize?client_id=1043528908148052089&permissions=378944&scope=bot"
      )
      .setEmoji("🔗");
    const aboutSection4 = new SectionBuilder()
      .addTextDisplayComponents(aboutText4)
      .setButtonAccessory(tbotInvite);
    container.addSectionComponents(aboutSection4);
    const developerText = new TextDisplayBuilder().setContent(
      [
        "# Developer",
        "Bot developed by <@625172218120372225>.",
        "Feel free to message <@625172218120372225> with questions or to suggest any new commands or features that aren't decks.",
        "You can report bugs or issues by dming Tbone or by using the bugreport command!",
      ].join("\n")
    );
    container.addTextDisplayComponents(developerText);
    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
       allowedMentions: { 
              users: []
            }
    });
  },
};
