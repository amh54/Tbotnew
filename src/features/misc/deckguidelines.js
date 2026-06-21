const {
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
        "3. Do not submit PvZH decks made in modded versions of the game. Tbot is solely for PvZH decks only, not for PvZH mods like Syndrome and others.",
        "4. The goal of Tbot decks is to compile relatively optimized versions of decks of all types. Strategies should be both unique from other decks in the database and well executed.",
        "5. You may still submit and replace a similar deck if you think yours is significantly better using the </submitdeckupdate:1518044716640243792> command.",
        "6. The deck types all have their own requirements:",
   "    - **Budget decks** should be cheap lists within the 2k-15k range. These are made and optimized for ranked gameplay",
   "    - **Competitive decks** requires actual testing data to validate as one of the best decks for a hero", 
   "    - **Ladder decks** should be made to crush ladder, performing well in Taco/Ultimate league specifically",
   "    - **Meme decks** should be well made and fun decks that feature unique, gimmicky concepts",
        "7. Decks will be submitted using the </submitdeck:1394802186659168446> command."
      ].join("\n")
    );
    const serverButton = new ButtonBuilder()
      .setLabel("Discord Server")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/2ruPV696Mg");
    const submitSection = new SectionBuilder()
      .addTextDisplayComponents(guidelinesText)
      .setButtonAccessory(serverButton);
    container.addSectionComponents(submitSection);
    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
