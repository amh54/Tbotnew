const {
  MessageFlags, 
  ContainerBuilder,
  TextDisplayBuilder,
} = require("discord.js");
module.exports = {
  name: `adddeck`,
  aliases: [
    `deckadd`,
    `deckaddition`,
    `canyouaddmydeck`,
    `addmydecktothebot`,
    `deckadditionsforthebot`,
    `deckaddrequirements`,
    `adddecks`,
    `decksuggestion`,
	  `submit`,
	  `submitdeck`,
	  `submitdecks`,
    `addeck`,
    `addecks`,
    `update`, 
    `updatedeck`,
    `deckupdate`,
    `suggestdeck`,
    `suggestdecks`,
    `suggestion`,
    `suggestions`,
    `add`,
    `decksubmission`,
    `decksubmissions`,
    `submitsuggestion`,
    `submitsuggestions`,
    `propose`,
    `proposals`,
    `proposedeck`,
    `proposedecks`,
    `suggest`,
    `submission`, 
    `submissions`,
  ],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    const container = new ContainerBuilder();
    const addDeckText1 = new TextDisplayBuilder().setContent([
      "# Deck Guidelines/Requirements before sumbitting",
      "1. Deck must be decent, have a gameplan or at least a theme, no random 1x, cards that don't fit. ", 
      "2. Deck must not be hacked can't run cards not included in hero and can't run more than 4 copies of a card. Do not sumbit pvzh decks made in modded versions of the game. Tbot is solely for pvzh decks only not for pvzh mods like syndrome and others.",
      "3. Tbot decks should aim to explore unique concepts in a meaningful way, with clear card choices and potential gimmicks to set them apart from the other options in tbot.",
      "4. You may still submit and replace a similar deck if you think yours is significantly better with your argument of why it's better through the deck update button",
      "5. The goal of Tbot decks is to compile relatively optimized versions of decks of all types.",
    ].join("\n"));
    container.addTextDisplayComponents(addDeckText1);
    const addDeckText2 = new TextDisplayBuilder().setContent([
      "Please use the </submitdeck:1394802186659168446> slash command to submit your deck.",
      "Otherwise use the </updatedeck:1394802186659168447> slash command to update one of your existing decks or another creator's deck."
    ].join("\n"));
    container.addTextDisplayComponents(addDeckText2); 
    await message.channel.send({
      components: [container], 
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
