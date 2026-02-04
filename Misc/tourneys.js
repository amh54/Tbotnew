const { ButtonBuilder, ButtonStyle,  ContainerBuilder,
 SectionBuilder, SeparatorSpacingSize, TextDisplayBuilder, MessageFlags } = require("discord.js");
module.exports = {
  name: `tourneys`,
  aliases: [
    `touraments`,
    `pvzhtourneys`,
    `tourneyspvzh`,
    `tourney`,
    `tournamentspvzh`,
    `pvzhtournaments`,
    `tournamentsforpvzh`,
    `tournaments`, 
    `tournament`,
    `servers`,
    `pvzhservers`,
  ],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    if(message.guild && message.guild.id == "285818469960646657"){
      return message.author.send("This command is disabled in this server please use it in another server");
    }
    else{
      const container = new ContainerBuilder()
    const tourneyText = new TextDisplayBuilder().setContent(
      "# Looking for Tournaments for PvZ Heroes? Below are some servers that host tournaments for PvZ Heroes!");
      container.addTextDisplayComponents(tourneyText);
      container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const tourneyText2 = new TextDisplayBuilder().setContent([
       "# Gray District",
      `Welcome to the Grey District, a server that aims to host gimmick tournaments with unique rules regularly. 
      Not interested in playing tournaments? No worries. 
      The server also features a database of decks used by tournament players from various tournaments as well!`
    ].join('\n'));
    const greyDistrict = new ButtonBuilder()
      .setLabel('Grey District')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/MAn67gyKm6')
      .setEmoji('<:hai:1468707820525453498>')
    const section2 = new SectionBuilder().addTextDisplayComponents(tourneyText2).setButtonAccessory(greyDistrict);
    container.addSectionComponents(section2);
    container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const tourneyText3 = new TextDisplayBuilder().setContent([
      "# Quicksand", 
      "Quicksand Tournaments is an elo system server, meaning that rather than participating in a bracket-style tournament, you can play at any time you like as long as there is another player who is down to play against you. Top 8 of each season (=3 months) participates in a special Playoffs Tournament. Hope to see you there!"
    ].join('\n'));
    const quicksand = new ButtonBuilder()
      .setLabel('Quicksand')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/VFGVmsAVdB')
      .setEmoji('<:quicksand:1273834699072081920>')
    const section3 = new SectionBuilder().addTextDisplayComponents(tourneyText3).setButtonAccessory(quicksand);
    container.addSectionComponents(section3);
    container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const tourneyText4 = new TextDisplayBuilder().setContent([
      "# pvzhtwjizñë", 
      "Essentially a tournament-focused server that aims to invite both new and experienced players. We tend to have tournaments every few months, sometimes being “gimmick” tournaments with special rules, while other times being a regular tournament with two brackets"
    ].join('\n'));
    const pvzhtwjizne = new ButtonBuilder()
      .setLabel('pvzhtwjizñë')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/7c9ybscBMN')
      .setEmoji('<:pvzhtw:1369013512709345372>')
    const section4 = new SectionBuilder().addTextDisplayComponents(tourneyText4).setButtonAccessory(pvzhtwjizne);
    container.addSectionComponents(section4);
    container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const tourneyText5 = new TextDisplayBuilder().setContent([
      "# Soup Gang", 
      "The Official Soup Gang is a server built to stop broth gang and revive Plants vs Zombies: Heroes tournaments. Quick Draft Tournaments are being host here every 1-2 months. What's Quick Draft you ask? Quick Draft is a tournament with gimmicks which those are; hero picks being randomised, no hero bans, a card ban for both sides! The soup is waiting for you..."
    ].join("\n"))
    const soupGang = new ButtonBuilder()
    .setLabel('Soup Gang')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/24VSU6uKYD')
    .setEmoji("<:soupgang:1394325298257858560>")
    const section5 = new SectionBuilder().addTextDisplayComponents(tourneyText5).setButtonAccessory(soupGang);
    container.addSectionComponents(section5);
    container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const tourneyText6 = new TextDisplayBuilder().setContent([
      "# Xera's White Space",
      "Xera's White Space is a server hosting of both normal and gimmick-focused tournaments, as well as the place for a passion project, that aims to revamp all strategy decks into community-chosen good decks and improve the pvzh AI. Tournaments are hosted around every 2 months."
    ].join("\n"))
    const xera = new ButtonBuilder()
    .setLabel("Xera's White Space")
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/t7pe5YjgAM')
    .setEmoji("<:xera:1411739428095004872>")
    const section6 = new SectionBuilder().addTextDisplayComponents(tourneyText6).setButtonAccessory(xera);
    container.addSectionComponents(section6);
    message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
  },
};
