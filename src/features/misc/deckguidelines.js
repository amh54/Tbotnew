const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorSpacingSize,
} = require("discord.js");

module.exports = {
  name: `deckguidelines`,
  run: async (client, message, args) => {
    const container = new ContainerBuilder();
    const titleText = new TextDisplayBuilder().setContent(
      "# Deck Guidelines/Requirements before submitting"
    );
    const thumbnail = new ThumbnailBuilder().setURL(
      client.user.displayAvatarURL()
    );
    const titleSection = new SectionBuilder()
      .addTextDisplayComponents(titleText)
      .setThumbnailAccessory(thumbnail);
    container.addSectionComponents(titleSection);
    container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const guidelinesText = new TextDisplayBuilder().setContent(
      [
        "1. Decks submitted must be fairly well made; it should have a solid strategy, use cards that are relevant and ideal for that strategy, and attempt to run optimized ratios (e.g. No random 1x cards).",
        "2. Deck cannot be hacked and must be usable in-game (Must run 40 cards, cannot run more than 4 copies of a card, etc.).",
        "3. Do not submit PvZH decks made in modded versions of the game or on deck-building websites like Sprout. Tbot is solely for PvZH decks **built in-game** only, not for PvZH mods like Syndrome and others.",
        `4. The goal of Tbot decks is to compile relatively optimized versions of decks of all types. Strategies should be both unique from other decks in the database and well executed.
Check decks in database through the [Tbot decklists page](https://pvzhtbot.com/decklists)`,
        `5. You may still submit and replace a similar deck if you think yours is significantly better using the [public decks page](https://pvzhtbot.com/publicdecks) or your personal decks page. Click on a deck to view the deck modal then click suggest deck. 
Find the deck you want to update through the Update Existing Deck tab.
You can also use the discord bot command version through the
</submitdeckupdate:1518044716640243792> command but website is the preferred option.`,
        "6. The deck types all have their own requirements:",
   "    - **Budget decks** should be cheap lists within the 2k-15k range. These are made and optimized for ranked gameplay",
   "    - **Competitive decks** requires actual testing data to validate as one of the best decks for a hero", 
   "    - **Ladder decks** should be made to crush ladder, performing well in Taco/Ultimate league specifically",
   "    - **Meme decks** should be well made and fun decks that feature unique, gimmicky concepts",
        `7. Decks will be submitted using the [public decks page](https://pvzhtbot.com/publicdecks) or from your personal decks page but make sure to suggest it as a New Deck this time. 
You can also use the </submitdeck:1394802186659168446> command for the discord bot version but the website is preferred.`
      ].join("\n")
    );
     container.addTextDisplayComponents(guidelinesText);

    container.addSeparatorComponents((separator) =>
      separator.setSpacing(SeparatorSpacingSize.Large)
    );

    const websiteButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Browse Tbot Decks")
        .setStyle(ButtonStyle.Link)
        .setEmoji("📚")
        .setURL("https://pvzhtbot.com/decklists"),
      new ButtonBuilder()
        .setLabel("Submit a Deck")
        .setEmoji("<:add:1561817648617103563>")
        .setStyle(ButtonStyle.Link)
        .setURL("https://pvzhtbot.com/publicdecks"),
      new ButtonBuilder()
        .setLabel("Discord Server")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:discord:1561815828473843712>")
        .setURL("https://discord.gg/2ruPV696Mg")
    );

    container.addActionRowComponents(websiteButtons);

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};