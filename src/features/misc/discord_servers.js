const {
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "tourneys",

  aliases: [
    "touraments",
    "pvzhtourneys",
    "tourneyspvzh",
    "tourney",
    "tournamentspvzh",
    "pvzhtournaments",
    "tournamentsforpvzh",
    "tournaments",
    "tournament",
    "servers",
    "pvzhservers",
  ],

  category: "Miscellaneous",

  run: async (client, message, args) => {
    if (message.guild?.id === "285818469960646657") {
      return message.author.send(
        "This command is disabled in this server please use it in another server",
      );
    }

    const db = client.db || require("../../../index.js");

    let rows = [];

    try {
      const result = await db.query(`
    SELECT
      id,
      name,
      description,
      discord_url,
      server_icon
    FROM discord_servers
    ORDER BY name ASC
  `);

      rows = result.rows || [];
    } catch (error) {
      console.error("Failed to fetch tourneys from PostgreSQL:", error);

      return message.channel.send(
        "Could not load tournament servers right now. Please try again later.",
      );
    }

    if (!rows.length) {
      return message.channel.send(
        "No tournament servers are currently listed.",
      );
    }

    const buildTourneysContainer = (serverRows, titleText) => {
      const container = new ContainerBuilder();

      const tourneyText = new TextDisplayBuilder().setContent(titleText);

      container.addTextDisplayComponents(tourneyText);

      container.addSeparatorComponents((separator) =>
        separator.setSpacing(SeparatorSpacingSize.Large),
      );

      serverRows.forEach((row) => {
        const serverName = row.name || "Unnamed Server";
        const description = row.description || "No description available.";
        const serverUrl = row.discord_url;
        const imageLink = row.server_icon;

        const details = [
          `# ${serverName}`,
          description,
          serverUrl ? `[Join ${serverName} Server](${serverUrl})` : null,
        ]
          .filter(Boolean)
          .join("\n");

        const section = new SectionBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(details),
        );

        if (imageLink) {
          section.setThumbnailAccessory(
            new ThumbnailBuilder().setURL(imageLink),
          );
        }

        container.addSectionComponents(section);

        container.addSeparatorComponents((separator) =>
          separator.setSpacing(SeparatorSpacingSize.Large),
        );
      });

      return container;
    };

    const maxRowsPerMessage = 18;

    for (let start = 0; start < rows.length; start += maxRowsPerMessage) {
      const chunk = rows.slice(start, start + maxRowsPerMessage);

      const title =
        start === 0
          ? `# Looking for PvZ Heroes Discord servers? 
Here are some great communities to join, including tournament servers and other places to connect with fellow players!
Note: New servers are added on a case by case basis and must be discussed with Tbone prior to being added.`
          : "# More PvZ Heroes Discord servers:";

      const container = buildTourneysContainer(chunk, title);

      await message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};
