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
    if(message.guild?.id == "285818469960646657"){
      return message.author.send("This command is disabled in this server please use it in another server");
    }
    else{
      const db = client.db || require("../../../index.js");

      let rows = [];
      try {
        const [result] = await db.query(
          `SELECT serverid, servername, description, label, discord_url, image_link
           FROM tourneys
           ORDER BY serverid ASC`
        );
        rows = result || [];
      } catch (error) {
        console.error("Failed to fetch tourneys from database:", error);
        return message.channel.send("Could not load tournament servers right now. Please try again later.");
      }

      if (!rows.length) {
        return message.channel.send("No tournament servers are currently listed.");
      }

      const container = new ContainerBuilder()
    const tourneyText = new TextDisplayBuilder().setContent(
      "# Looking for Tournaments for PvZ Heroes? Below are some servers that host tournaments for PvZ Heroes!");
      container.addTextDisplayComponents(tourneyText);
      container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

      rows.forEach((row, index) => {
        const serverName = row.servername || "Unnamed Server";
        const description = row.description || "No description available.";
        const buttonLabel = row.label || serverName;
        const serverUrl = row.discord_url;
        const imageLink = row.image_link;

        const details = [
          `# ${serverName}`,
          description,
        ]
          .filter(Boolean)
          .join("\n");

        const serverText = new TextDisplayBuilder().setContent(details);
        const section = new SectionBuilder().addTextDisplayComponents(serverText);

        if (imageLink) {
          section.setThumbnailAccessory((thumbnail) =>
            thumbnail
              .setDescription(`${serverName} server image`)
              .setURL(imageLink)
          );
        }

        container.addSectionComponents(section);

        if (serverUrl) {
          const linkSectionText = new TextDisplayBuilder().setContent(`Join ${serverName}:`);
          const linkSection = new SectionBuilder()
            .addTextDisplayComponents(linkSectionText)
            .setButtonAccessory(
              new ButtonBuilder()
                .setLabel(buttonLabel.substring(0, 80))
                .setStyle(ButtonStyle.Link)
                .setURL(serverUrl)
            );

          container.addSectionComponents(linkSection);
        }

        if (index < rows.length - 1) {
          container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
        }
      });

    message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
  },
};
