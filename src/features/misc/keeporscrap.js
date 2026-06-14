const {
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ActionRowBuilder, 
    ContainerBuilder, 
    ThumbnailBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    MessageFlags,
    SeparatorSpacingSize, 
} = require("discord.js");

async function buildKeepOrScrapContainers(client, includeSelect = true) {
        const IntroContainer = new ContainerBuilder();
        const introText1 = new TextDisplayBuilder().setContent([
          "# Keep or Scrap Created By <@256910306003910658>."
        ].join("\n"));
        const user = await client.users.fetch("256910306003910658");
        const authorImage = new ThumbnailBuilder().setURL(user.displayAvatarURL());
        const authorSection = new SectionBuilder()
          .addTextDisplayComponents(introText1)
          .setThumbnailAccessory(authorImage);
        IntroContainer.addSectionComponents(authorSection);
        IntroContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
         const introText2 = new TextDisplayBuilder().setContent([
`This "keep or scrap" list is for players who are either new to the game or returning after a long time of not playing. It's meant to broadly guide them on which cards are worth keeping, which cards are worth scrapping, and which cards are worth using in their budgeted decks.`, 
"To be more specific, each tier of each list represents why or why not the cards in them should be kept or scrapped:",
"- **Craft**: Cards so good, that they should actually be sought out and built around. You have practically zero reason to scrap these cards", 
`- **Keep**: Cards that are especially useful for whatever class they belong to. Cards in "Use" are more useful at a low budget, while cards in "Hold for Later" are better used in decks highlighting their capabilities (e.g. Imitator isn't worth running until you unlock Transfiguration, but it becomes one of your strongest tempo options once you do)`, 
`- **Scrappable**: Cards that are much more situational in when they're kept, and can be worth scrapping if you need the sparks. Cards in "Usable" are generally useful on a budget, but are overall weaker than the cards in the Keep tiers and aren't worth running at max. Cards in "Niche" are effective in very specific strategies and generally do nothing outside of them`,
"- **Scrap**: Overall bad and/or unhelpful cards that aren't worth keeping. There's practically no reason to keep these cards unless you want to keep every card you collect (which is valid, but not what this guide is for)"
                ].join("\n"));
                IntroContainer.addTextDisplayComponents(introText2);
                IntroContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
        const introText3 = new TextDisplayBuilder().setContent([
"# Who made this?",
`This was made by <@256910306003910658>. His job was to put together the initial lists and collect criticism for them from the Elo community, to make sure that each list was not heavily biased towards any one idea. 
This list is meant to be a broad standard for which cards less experienced players should value, and is not based on fickle reasoning.
If you see a card in a certain tier, chances are that it got placed there after serious deliberation. This is likely not a perfect guide, and likely won't be accurate far into the future. 
However, lolatopia genuinely did try to make these as objective as possible. The last thing he wants is for these guides to mislead people into keeping unhelpful cards or scrapping cards that are valuable. 
If you still have questions, feel free to ping <@256910306003910658>, and he will respond when he can`
        ].join("\n"));
        IntroContainer.addTextDisplayComponents(introText3);
        IntroContainer.setAccentColor(16777215);
        const zombieContainer = new ContainerBuilder();
        const zombieText1 = new TextDisplayBuilder().setContent([
        "# Beastly",
        "- **Deep Sea Garg** has moved to Scrap since it's very underwhelming into Guardian despite not doing much for other match-ups", 
        "- **King of the Grill** is in Keep since you don't run Deep Sea Gargantuar anymore, so it's an essential MidGargs win condition for those decks", 
        "- **Hunting Grounds** is ran in some MidGargs lists, so it's in Scrappable"
      ].join("\n"));
      const beastlyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834648985337957/ZBeastly.png?ex=6a307287&is=6a2f2107&hm=057933fcc42c2285023c5acc7fbc169875bc28dfd96d55f01202b3e169c9644d&=&format=webp&quality=lossless&width=737&height=649")
      const beastlySection = new SectionBuilder()
        .addTextDisplayComponents(zombieText1)
        .setThumbnailAccessory(beastlyImage);
      zombieContainer.addSectionComponents(beastlySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const zombieText2 = new TextDisplayBuilder().setContent([
        "# Brainy",
        "- **Teleport** is in Craft instead of TPZ since it's just the better card of the two and synergizes better with Zom-Blob in particular", 
        "- **Duckstache** is in Keep since Mustaches are actually very strong and every hero (except Rustbolt) runs it well. Brainstorm in particular runs this card the best, but it's also strong on Super Brainz and Huge Giganticus, and Mustaches are great on Immorticia if you have Teleport and/or Teleportation Zombie unlocked",
        "- **Electrician** is in Scrappable. It's a strong card in Science Aggro, but that's pretty much it",
        "- **Mechasaur** is in Scrappable since you basically only run it in Young Ken Martin, even if it's really good in that one deck. Interdimentional, Thinking Cap, and Evolutionary Leap have moved up to Scrappable for the same reason",
        "- **Leprechaun Imp** is in Scrappable as an all-purpose 1-drop that's particularly useful in Telimps and certain Rustbolt lists, despite very rarely being an optimal inclusion"
      ].join("\n"));
      const brainyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834649690247268/ZBrainy.png?ex=6a307287&is=6a2f2107&hm=34aeb9b615fb28679d9da909aaa28becc08f2f5a387032946d72afb42763b63b&=&format=webp&quality=lossless&width=737&height=649")
      const brainySection = new SectionBuilder()
        .addTextDisplayComponents(zombieText2)
        .setThumbnailAccessory(brainyImage);
      zombieContainer.addSectionComponents(brainySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const zombieText3 = new TextDisplayBuilder().setContent([
        "# Crazy",
        "- **Aerobics** has moved down to Keep, as it's not especially powerful beyond budget decks. It's still extremely useful in aggro decks, but maxed Crazy rarely runs Aggro aside from Z-Mech, so it's just not an essential card to get",
        "- **Grave Robber** and **Exploding Fruitcake** are Scrappable since they're also very niche nowadays. Grave Robber is exclusively used on Brainstorm, but is an essential part of his decks. Fruitcake in general is hard to justify outside of fringe use cases, but is otherwise powerful removal for the deck that need it",
        "- **Hippity Hop Gargantuar** and **Garg-Throwing Imp** are Keep since they're commonly used in maxed lists for Z-Mech, Boogaloo, and Impfinity"
      ].join("\n"));
      const crazyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834650399080489/ZCrazy.png?ex=6a307287&is=6a2f2107&hm=7813355c8151b0f5ffef66d7ebae71034eb497cea7ce65696fe89f3a79fe85a9&=&format=webp&quality=lossless&width=737&height=649")
      const crazySection = new SectionBuilder()
        .addTextDisplayComponents(zombieText3)
        .setThumbnailAccessory(crazyImage);
      zombieContainer.addSectionComponents(crazySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const zombieText4 = new TextDisplayBuilder().setContent([
        "# Hearty",
        "- **Knockout, Warlord, and Battlecruiser** are now Keep since you use these cards in the majority of your decks, as Hearty at max has not a lot going on",
        "- **King** in particular is also Keep since it gives budget decks more play-around into Solar and Guardian. It's also used at max on Z-Mech and is generally a fine tempo option", 
        "- **Pharaoh** is Scrappable since it's key support for any control deck, but does nothing outside of that"
      ].join("\n"));
      const heartyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834651187351673/ZHearty.png?ex=6a307287&is=6a2f2107&hm=8504f5d09d0c86ead6d68073e2d9f469f036cdf54a8e02119fa79263873e0b50&=&format=webp&quality=lossless&width=737&height=649")
      const heartySection = new SectionBuilder()
        .addTextDisplayComponents(zombieText4)
        .setThumbnailAccessory(heartyImage);
      zombieContainer.addSectionComponents(heartySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const zombieText5 = new TextDisplayBuilder().setContent([
        "# Sneaky", 
        "- **Cowboy** is in Keep, while **Gargolith and Cryo-Yeti** are in Craft. This is since what's actually strong on Sneaky has shifted a lot. Specifically, aggro in general is quite weak and cards like Gargolith and Cryo-Yeti help solve the mid game against non-Guardian heroes", 
        "- **Laser Base Alpha** and **Tomb Raiser** are in Use for this same reason, as you commonly pair LBA with Tomb Raiser, Gargolith, and Cryo-Yeti. This again creates a powerful mid game that makes up for Sneaky's weaker early game and general lack of lethality", 
        "- **Raptor** is in Scrap since it's ultimately not a good card anymore. It's very consistently answered, stronger cards are being played on turn 3, and you're running strong top-end anyway. This is on top of doing nothing for you on a budget",
        "- **Imposter** is in Keep since it's actually used often enough outside of Imp strategies that you don't like to scrap it. Specifically, it's good in off-meta stuff for every hero on top of being better than most your budget 1-drop options (excluding Mini-Ninja and Buried Treasure, which still is comparable to it in terms of utility and deck function)"
      ].join("\n"));
      const sneakyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834651904708778/ZSneaky.png?ex=6a307287&is=6a2f2107&hm=dd732cfdc54eb527653456f82d3605061497a333b971b04ca55812f89ed3ec27&=&format=webp&quality=lossless&width=855&height=649")
      const sneakySection = new SectionBuilder()
        .addTextDisplayComponents(zombieText5)
        .setThumbnailAccessory(sneakyImage);
      zombieContainer.addSectionComponents(sneakySection);
      zombieContainer.setAccentColor(10494192);
      const plantContainer = new ContainerBuilder(); 
      const plantText1 = new TextDisplayBuilder().setContent([
          "# Guardian",
          "- **Red Stinger** and **Hot Date** were moved to Scrappable, as their use in maxed lists has fallen off significantly. Red Stinger is also not terribly useful on a budget since you actually just have better 4-drops to run in most cases, but it can be ideal in aggro decks", 
          "- **Body-Gourd** has moved to Keep since it's actually useful in a variety of decks as strong top-end that can help any hero get their superpowers quickly. This especially matters to Grass Knuckles and Citron (to fish for Time to Shine and Peel Shield), but Wall-Knight and Spudow also have very strong superpowers and want valuable top-end"
        ].join("\n"));
        const guardianImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834645755985930/PGuardian.png?ex=6a307286&is=6a2f2106&hm=ea424e4dd4f819dd700822164a36885bc4dca95be0f5011d711d7645d4e6c64f&=&format=webp&quality=lossless&width=737&height=649")
        const guardianSection = new SectionBuilder()
          .addTextDisplayComponents(plantText1)
          .setThumbnailAccessory(guardianImage);
          plantContainer.addSectionComponents(guardianSection);
       plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
        const plantText2 = new TextDisplayBuilder().setContent([
          "# Kabloom",
          "- **Astro-Shroom** and **Imitator** have been moved up to Keep for their own reasons; Astro-Shroom is a consistently strong budget option that's used in certain maxed lists, while Imitator is practically game-winning with Transfiguration and certain other 4-drops (most notably Starch Lord)", 
          "- Cards like **Reincarnation**, **Molekale**, and more that were previously in Scrap have been moved to Scrappable. This was done under the assumtion that anyone following this list might actually want to play Kabloom as a main class, even though these cards very rarely serve a purpose on a budget and are unreliable in general"
        ].join("\n"));
        const kabloomImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834646376484925/PKabloom.png?ex=6a307286&is=6a2f2106&hm=e9b5497ca367866155d37e14135208952dd00159fdcc5a1410ea61c1d777e338&=&format=webp&quality=lossless&width=642&height=649")
        const kabloomSection = new SectionBuilder()
          .addTextDisplayComponents(plantText2)
          .setThumbnailAccessory(kabloomImage);
        plantContainer.addSectionComponents(kabloomSection);
   plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const plantText3 = new TextDisplayBuilder().setContent([
        "# Mega-Grow", 
        "- **Espresso Fiesta** has moved down. This is since Plant Food is adiquite on its own and, on a budget, Espresso Fiesta isn't terribly powerful unless you're playing Chompzilla. It's still a great card, but one that expects some support to reach its full potential", 
        "- Meanwhile, **Clique Peas** and **Lily of the Valley** have gone up. These cards are much stronger on a budget since they provide unique opportunities to create game-winning plays. Lily of the Valley is extremely aggressive compared to Vegetation Mutation, while Clique Peas has great stats, Pea synergies, and can be game-winning literally on its own",
      ].join("\n"));
      const megaGrowImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834646963945643/PMega.png?ex=6a307286&is=6a2f2106&hm=be0cd1386a937a87ea2d6f0b360e4711aa16c539a05a18441f93346c05df7027&=&format=webp&quality=lossless&width=649&height=649")
      const megaGrowSection = new SectionBuilder()
        .addTextDisplayComponents(plantText3)
        .setThumbnailAccessory(megaGrowImage);
      plantContainer.addSectionComponents(megaGrowSection);
   plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const plantText4 = new TextDisplayBuilder().setContent([
        "# Smarty", 
        "- **Sportacus** is in Keep since it's actually consistently ran across Green Shadow, Nightcap, and Citron as a trick deterrent. While it's not great at this job, these heroes are rather weak and often need a solid answer to trick-based combo decks",
        "- **Winter Melon** is in Use now since it's actually very strong top-end despite its bug. The splash damage alongside its on-play ability allows you to easily win board advantage against any hero", 
        "- **Cool Bean** is in Scrappable as an on-curve 3-drop, bean synergizer, and gravestone tech option rolled into one card. It's still underwhelming, but on a budget, you lack options anyways and typically need something to play on turn 3 besides Rescue Radish"
      ].join("\n"));
      const smartyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834647546957924/PSmarty.png?ex=6a307286&is=6a2f2106&hm=8bfe1cf80b42b79d290d35fe728ea6be3ab1dfe76bc3c779c368c0e0830ef416&=&format=webp&quality=lossless&width=737&height=649")
      const smartySection = new SectionBuilder()
        .addTextDisplayComponents(plantText4)
        .setThumbnailAccessory(smartyImage);
      plantContainer.addSectionComponents(smartySection);
      plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const plantText5 = new TextDisplayBuilder().setContent([
        "# Solar", 
        "- **Sun-Shroom** is not in Craft! This is since a lot of its value depends on you actually owning valuable cards, so crafting it before you get said cards is fairly backwards", 
        "- **Cross-Pollination** instead has moved up, as it's become an auto-include alongside Aloesaurus, which is now Keep tier. These two cards combine extremely well with Sun-Shroom, so it's the package you try to build into after you craft Ketchup Mechanic", 
        "- For similar reasons, **Three-Headed Chomper** is in Scrappable, as it's powerful top-end when ramped out and otherwise helps solve certain match-ups for you until you can unlock better top-end (most notably the Sneaky match-up)"
      ].join("\n"));
      const solarImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1030888661581041775/1515834648356323429/PSolar.png?ex=6a307287&is=6a2f2107&hm=9b76f75215d66c26e85417ecf988f2dd4d92b281391cceff47159cb369d426a5&=&format=webp&quality=lossless&width=642&height=649")
      const solarSection = new SectionBuilder()
        .addTextDisplayComponents(plantText5)
        .setThumbnailAccessory(solarImage);
      plantContainer.addSectionComponents(solarSection);
        plantContainer.setAccentColor(65280);
        return {
          introContainer: IntroContainer,
          plantContainer,
          zombieContainer
        };
    }

module.exports = {
  name: "keeporscrap",
  aliases: ["kos"],
  category: "Miscellaneous",
  buildKeepOrScrapContainers,
  run: async (client, message) => {
    const { introContainer, plantContainer, zombieContainer } = await buildKeepOrScrapContainers(client);

    return message.channel.send({
      components: [introContainer, plantContainer, zombieContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    });
  }
};
