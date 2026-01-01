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
    MediaGalleryBuilder
} = require('discord.js');
module.exports = {
    name: `guide`, 
    aliases: [`deckbuildingguide`, `deckbuilding`, `guidelines`, `deckhelp`],
    category: `Miscellaneous`,
    run: async (client, message, args) => {
    const selectGuide = new StringSelectMenuBuilder()
    .setCustomId("selectGuide")
    .setPlaceholder("Select an option below to view the guide")
    .addOptions(
        new StringSelectMenuOptionBuilder()
        .setLabel("Curve")
        .setDescription("Explains curve in decklists")
        .setValue("curve"), 
        new StringSelectMenuOptionBuilder()
        .setLabel("Archetypes")
        .setDescription("Explains archetypes in decklists")
        .setValue("archetypes"), 
        new StringSelectMenuOptionBuilder()
        .setLabel("Finishing Power")
        .setDescription("Explains how decklists should finish games")
        .setValue("finishing_power"), 
        new StringSelectMenuOptionBuilder()
        .setLabel("Removal and Answers")
        .setDescription("Explains removal and answers in decklists")
        .setValue("removal_and_answers"),
        new StringSelectMenuOptionBuilder()
        .setLabel("Superpowers and closing thoughts")
        .setDescription("Explains superpowers and closing thoughts in decklists")
        .setValue("superpowers_and_closing_thoughts"), 
        new StringSelectMenuOptionBuilder()
        .setLabel("Glossary")
        .setDescription("Explains key terms and concepts in decklists")
        .setValue("glossary"), 
        new StringSelectMenuOptionBuilder()
        .setLabel("Examples")
        .setDescription("Provides examples of bad deckbuilding")
        .setValue("examples")
    )
    const selectRow = new ActionRowBuilder().addComponents(selectGuide);
    const guideContainer = new ContainerBuilder()
    const guideText = new TextDisplayBuilder().setContent([
        "# __Deck building guidelines__", 
        "__Written by Shortbow and Seasons, with additional help from Mono and Luke__",
        "__Last updated on 20/08/25__" 
    ].join("\n"));
    guideContainer.addTextDisplayComponents(guideText);
    guideContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const guideText2 = new TextDisplayBuilder().setContent([
        "Are you looking to build your very own deck? Well, conveniently for you, you're in the r/PvZH community's deck building section.", 
        "Before we get into it, I'd like to mention you can ping @Deck Helper or just @ me (shortbow) personally if you need any hands-on assistance.", 
        "If you're looking for decks, make sure to check out the <#1236513132260884560> or <#1236528269092720670>, depending on how many sparks you have. You may also check out <#1236515727998193664> for a few cheeky options.", 
        "You can also use <@1043528908148052089> help to see the wide array of lists that are offered."
   ].join("\n"));
   guideContainer.addTextDisplayComponents(guideText2);
   guideContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const guideText3 = new TextDisplayBuilder().setContent(
    "If you're confused and feel you need both rundowns of abbreviations and more visual examples, check out the glossary option in the select menu below: The deck building guide parts from the doc are divided into specific sections on the select menu below, and the examples page can give some examples of bad deckbuilding")
   guideContainer.addTextDisplayComponents(guideText3);
    guideContainer.addActionRowComponents(selectRow);
   message.channel.send({
    components: [guideContainer],
    flags: MessageFlags.IsComponentsV2
   })
   const curveContainer = new ContainerBuilder()
   const curveTitle = new TextDisplayBuilder().setContent("# __1. Curve__");
    curveContainer.addTextDisplayComponents(curveTitle);
    curveContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const curveText = new TextDisplayBuilder().setContent(
    "Most, if not all, good decks will contain at least 8x 1 cost cards and a similar amount of 2 costs, as having ways to answer early game threats such as cheese cutter, conman, spacetime, etc. is incredibly important. The amount you actually want varies from deck to deck, but it can usually be identified via what sort of deck you're playing. Deck archetypes are detailed in the archetypes section of the select menu."
   )
   curveContainer.addTextDisplayComponents(curveText);
   curveContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const curveText2 = new TextDisplayBuilder().setContent(
    "Zombies generally aren't as concerned with answering early game plays as the plants are, but there are a few notable examples. If the plant player gets to sneak in a Lima, Pumpking or any other early aggro card, you may find yourself the victim of an unstoppable avalanche. This is where the Zombie's ability to play tricks last come into play. You may sub out some of your one cost zombies with these tricks, or simply run them both at the same time for matchup versatility and consistency. Please note that you cannot run only tricks as certain plant cards will heavily punish you for this, most notably Forget Me Nuts which increases the price of your tricks, leaving you defenseless."
   )
   curveContainer.addTextDisplayComponents(curveText2);
   curveContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const curveText3 = new TextDisplayBuilder().setContent([
    "**__Aggro__** - 11-14x one cost cards. We have to guarantee we have enough low cost cards as we want to start dealing damage as soon as possible.", 
    "**__Midrange__** - 6x-10x one costs. This greatly depends on how much topend the deck has.", 
    "**__Control__** - 4x-8x one costs. The control rule is far looser than the rest, as it heavily depends on what hero you're running. Heroes like WK may not be as concerned with answering early game threats as we plan to just heal it off anyway, while GK has to take control very early on."
   ].join("\n"))
   curveContainer.addTextDisplayComponents(curveText3);
   curveContainer.addActionRowComponents(selectRow);
   const archetypesContainer = new ContainerBuilder()
   const archetypesTitle = new TextDisplayBuilder().setContent("# __2. Archetypes__");
   archetypesContainer.addTextDisplayComponents(archetypesTitle);
   archetypesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const archetypesText = new TextDisplayBuilder().setContent([
    "I know this is a point a lot of people struggle with, but we have an iconic metaphor in this community to explain the difference.", 
    "The main archetypes are Aggro, Midrange and Control. Aggro and Control are a lot more defined, while Midrange is a more loose umbrella term with lots of very different decks within it."
   ].join("\n"));
   archetypesContainer.addTextDisplayComponents(archetypesText);
   archetypesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const archetypesText2 = new TextDisplayBuilder().setContent([
    "To explain deck types using a footrace analogy:", 
    "**AGGRO** - you go for an all-out sprint to the finish line", 
    "**CONTROL** - you try to break everyone's legs, therefore winning by default", 
    "**MIDRANGE** - you run at a steady pace, waiting for the aggro dudes to tire out (also you have swole legs so control dudes can't stop you in time)"
   ].join("\n"));
   archetypesContainer.addTextDisplayComponents(archetypesText2);
   archetypesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const archetypesText3 = new TextDisplayBuilder().setContent([
        "To explain this a bit further, Aggro aims to win the game as soon as possible, often forgoing defense and just focusing on consistent damage turn after turn. Running out of cards is our number one concern, so try to play in a way that allows your board to live while pushing damage every round. There will of course be times in which you will have to play defensively, and some aggro decks do run a few of these tools, but they are difficult to incorporate, so I'd recommend asking for help and getting more experience first.", 
        "Midrange is a bit more difficult to put into words as it's a far looser term as previously mentioned. A midrange deck could be mostly focused on an aggressive early game but also have a steady supply of midgame cards to compete should their initial plan fail, or they could be far less reliant on early game and focus on playing powerful midgame cards such as transfiguration, Apotatosaurus, Gatling, Astrocado, and so on.", 
        "This often leads to a bit of confusion whether some slower midrange decks count as control or not, but the main way to differentiate between them is actually quite simple. Does your deck focus on getting to an expensive lategame play to win the game, and primarily plays defensively until that point? Then it's a control deck. If your deck does have a focus on lategame, but also plays proactively in the mid- and/or earlygame it's just a slower midrange list."
   ].join("\n"));
   archetypesContainer.addTextDisplayComponents(archetypesText3);
   archetypesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
   const archetypesText4 = new TextDisplayBuilder().setContent([
    "There's also Tempo and Combo, which aren't considered primary deck archetypes as they don't really say much about the general pacing of the deck, but rather how the deck aims to win.", 
    "**TEMPO** - you jog just ahead of the opponents and trip them whenever they get too close.",
    "**COMBO** - you spend some time at the starting line building a catapult to fling yourself right to the finish line.", 
    "__Credit to Sushi for popularizing the analogy many years ago.__"
   ].join("\n"));
    archetypesContainer.addTextDisplayComponents(archetypesText4);
    archetypesContainer.addActionRowComponents(selectRow);
    const finishingPowerContainer = new ContainerBuilder()
    finishingPowerContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("# __3. Finishing Power__"));
    finishingPowerContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const finishingPowerText = new TextDisplayBuilder().setContent(
        "In most decks, there are 2-4 cards that are classified as “finishers” and are essential for the deck to be proactive, create space on the board, or deal enough damage to actually win the game. This does not mean that a finisher HAS to take up space on the board or be proactive, but it needs to be able to consistently finish off your opponent."
    );
    finishingPowerContainer.addTextDisplayComponents(finishingPowerText);
    finishingPowerContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const finishingPowerText2 = new TextDisplayBuilder().setContent("The archetype of the deck you’re using heavily impacts what finishers it should have, but this is usually pretty intuitive. The finishers in your deck should match the pace of the rest of your deck, so that they fit in seamlessly. For example, you really don’t want to be running Zombot and Octo zombie in your aggro Flag swarm deck, as they come into play far too late into the game, when you’re likely to have lost.");
    finishingPowerContainer.addTextDisplayComponents(finishingPowerText2);
    finishingPowerContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const finishingPowerText3 = new TextDisplayBuilder().setContent("It's also common to run multiple finishers. Having multiple finishers in a deck guarantees (at least as far as possible) that you’ll have a win condition that actually works in the matchup you’re playing. A classic example would be Rustbolt’s old control decks, which would usually use both Mechasaur and Trickster at the same time. Mechasaur acted as your beefy, board building finisher that could be teleported in and gained more value the longer it stayed on the board, forcing your opponent to either answer it or lose outright.");
    finishingPowerContainer.addTextDisplayComponents(finishingPowerText3);
    finishingPowerContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const finishingPowerText4 = new TextDisplayBuilder().setContent("Trickster was the perfect addition, as it not only benefitted from tricks being played (which is the primary way of controlling the board when playing RB) but also offered some much-needed burst damage. This led to a deck that, despite its flaws, had a clear-cut way of how it's supposed to win.");
    finishingPowerContainer.addTextDisplayComponents(finishingPowerText4);
    finishingPowerContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const finishingPowerText5 = new TextDisplayBuilder().setContent("Finding this form of synergy between your win conditions is not a necessity, but is something worth keeping in mind. As long as your win conditions are consistently closing off the game, there’s no need to look for some secret sauce.");
    finishingPowerContainer.addTextDisplayComponents(finishingPowerText5);
    finishingPowerContainer.addActionRowComponents(selectRow);
    const removalAndAnswersContainer = new ContainerBuilder()
    removalAndAnswersContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("# __4. Removal and Answers__"));
    const removalAndAnswersText = new TextDisplayBuilder().setContent(
        "PvZH is a very unique card game in quite a few ways, and one of the most clear-cut differences is its approach to removal. When talking about the responses we have at hand for our opponents plays, it’s important to keep in mind that this doesn't just mean using tricks and strict removal tools such as Shamrocket or Weed Spray. We are instead simply talking about how we prevent a card from being too harmful, which really ends up varying from card to card."
    );
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText);
    const removalAndAnswersText2 = new TextDisplayBuilder().setContent("A card which is primarily just stats with no additional keywords can be answered via a classic chump block if no better options are available. Sacrificing a cheap minion or two to preserve your health is a perfectly fine play once in a while.");
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText2);
    removalAndAnswersContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const removalAndAnswersText3 = new TextDisplayBuilder().setContent("Other cards are more threatening and have ways to gain value, either through breaking through your defense or by generating more cards, stats, etc. by staying alive, which forces a full answer. This is where the purely removal focused cards, which are primarily tricks or minions that require specific conditions, tend to become more relevant.");
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText3);
    removalAndAnswersContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const removalAndAnswersText4 = new TextDisplayBuilder().setContent("This is why removal is, by its very nature, a reactive way of playing. You can’t exactly remove something that has yet to be played. Therefore, removal cards tend to lend themselves better to control and slower midrange decks, who wish to drag out the game, rather than play proactively to close off the game.");
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText4);
    removalAndAnswersContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const removalAndAnswersText5 = new TextDisplayBuilder().setContent("This doesn’t mean that you shouldn’t run any form of removal in faster paced decks, but you should prioritize more proactive options that help close off the game, rather than trying to remove their cards outright.");
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText5);
    removalAndAnswersContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const removalAndAnswersText6 = new TextDisplayBuilder().setContent("There are also some cases in which some cards can act as both removal / answers and a proactive threat. Examples would include Bungee Plumber, Berry Blast, Quazard, Sumo, and Ketchup Mechanic are all examples. Those cards are also what are often called “auto-runs”, as their utility and effectiveness means that they are run in the large majority of decks that can use them.");
    removalAndAnswersContainer.addTextDisplayComponents(removalAndAnswersText6);
    removalAndAnswersContainer.addActionRowComponents(selectRow);
    const superpowersAndClosingThoughtsContainer = new ContainerBuilder()
    superpowersAndClosingThoughtsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("# __5. Superpowers and Closing Thoughts__"));
    const superpowersAndClosingThoughtsText = new TextDisplayBuilder().setContent(
        "Before we finish this guide off, we're going to quickly talk about superpowers. While most heroes definitely benefit from their supers, they’re not too important to consider in the grand scheme of your deck building. ",
    )
    superpowersAndClosingThoughtsContainer.addTextDisplayComponents(superpowersAndClosingThoughtsText);
    const superpowersAndClosingThoughtsText2 = new TextDisplayBuilder().setContent("Supers are a miniscule fraction of the game and outside early game answers or some incredibly overpowered supers such as Brain freeze’s full board freeze signature, you shouldn’t really let them hinder what sort of decks you build for each hero. They’re additional spice, not the main course, and should be treated as such. Do however make sure to take them into account in your games, but do not think of your hero's supers as a centerpiece in your list, since you cannot ever guarantee that you’ll get the exact one you want.");
    superpowersAndClosingThoughtsContainer.addTextDisplayComponents(superpowersAndClosingThoughtsText2);
    superpowersAndClosingThoughtsContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const superpowersAndClosingThoughtsText3 = new TextDisplayBuilder().setContent("At the end of the day, it's important to keep in mind that rules in creative fields are meant to be broken, and exploration should be encouraged. These guidelines seek to guide you towards making the most consistent and well put together lists possible, but that may not be your goal. I’d also like to point out that most cards have some sort of niche that they can serve. Are they all any good? Nope! Absolutely not.");
    superpowersAndClosingThoughtsContainer.addTextDisplayComponents(superpowersAndClosingThoughtsText3);
    superpowersAndClosingThoughtsContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const superpowersAndClosingThoughtsText4 = new TextDisplayBuilder().setContent("But play 'em if you want to. Video games are for fun, so do as you please. So get out there, crush your next opponent, and tell them Shortbow sent ya.");
    superpowersAndClosingThoughtsContainer.addTextDisplayComponents(superpowersAndClosingThoughtsText4);
    superpowersAndClosingThoughtsContainer.addActionRowComponents(selectRow);
    const glossaryContainer = new ContainerBuilder()
    const title = new TextDisplayBuilder().setContent([
        "# **__Glossary__**", 
    "__Last updated 20/08/25__",
   "Relevant pvzh lingo and such. Will be updated over time"].join("\n"));
    glossaryContainer.addTextDisplayComponents(title);
    const glossaryText = new TextDisplayBuilder().setContent([
        "**__Mulligan__** - Rerolling your cards at the start of the game.",
        "**__California roll / caliroll__** - Getting a block after 3 hits. This can only happen by rolling at least two 3s and a 2.",
        "**__Topend__** - The most expensive parts of a deck, which is usually referred to as being the top of the deck despite being at the bottom of the screen. This is because they’re played later in the game, aka at a higher turn count.",
        "**__Earlygame__** - The initial stages of the game. Usually described as turn 1-3.",
        "**__Lategame__** - The closing turns of the game. Usually described t6 and out.", 
        "**__Signature/Sig__** - The unique superpowers that belong to only one hero.",
        "Please click on Image below to see full image of all heroes"
    ].join("\n"));
    glossaryContainer.addTextDisplayComponents(glossaryText);
    glossaryContainer.addActionRowComponents(selectRow);
    const glossaryMedia = new MediaGalleryBuilder().addItems(
        mediaGalleryItem => mediaGalleryItem
        .setDescription("Plant Heroes")
        .setURL("https://media.discordapp.net/attachments/1152624944262414436/1407859455215014069/image.png?ex=68a7a2ca&is=68a6514a&hm=d5a939851ccbb60fb34e3fe2280bea07926774b7b8d36a58036db39c7bf82dbb&=&format=webp&quality=lossless&width=582&height=770"), 
        mediaGalleryItem => mediaGalleryItem
        .setDescription("Zombie Heroes")
        .setURL("https://media.discordapp.net/attachments/1152624944262414436/1407859695804219733/image.png?ex=68a7a304&is=68a65184&hm=e317e59631857c997be589ead373cf95a26bf2fdf9439195a31a2909114c0e56&=&format=webp&quality=lossless&width=552&height=770")
    )
    const examplesContainer = new ContainerBuilder()
    const examplesText = new TextDisplayBuilder().setContent([
        "# __Examples:__", 
        "Here are some examples of decks which have common but easily solvable problems.", 
    ].join("\n"));
    examplesContainer.addTextDisplayComponents(examplesText);
    examplesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const examplesText2 = new TextDisplayBuilder().setContent([
        "## Example 1:", 
        "This deck has a few conflicting ideas. The majority of the cards want to win the game quickly, but conflict with the finishers. I must note that octo and zombot do not synergize in the slightest with the aggro-combo base that is present. Instead, cheaper finishing cards like Primal yeti and maniacal laugh would round the deck out more. Zombot and octo are both too expensive to use in this deck, so a more optimal approach should be to choose finishers that buff a big board, (maniacal/viral/PYeti) or big stat sticks (SNgarg/KoTG/Bcruiser)."
    ].join("\n"));
    const example1Thumbnail = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1312037763784376370/1407865092413849660/Screenshot_20250820-191221.png?ex=68a7a80a&is=68a6568a&hm=a65938fbc7458018ac85f0a0c0be23d845119fd4964c4b518b462c634be2cf10&=&format=webp&quality=lossless&width=749&height=770")
    const example1Section = new SectionBuilder().addTextDisplayComponents(examplesText2).setThumbnailAccessory(example1Thumbnail);
    examplesContainer.addSectionComponents(example1Section);
    examplesContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
    const examplesText3 = new TextDisplayBuilder().setContent([
        "### Example 2:", 
        "When building meme ideas, it's important to realize  they sometimes aren't worth it if they do minimal damage or literally nothing. For example, I have this old SF deck that is poorly made. It has a heal base, but the meme is to cuke your own 7 drop card to do 6 damage to face. Not only is this meme not worth it, but you waste a whole turn to kill your own board with minimal backup lategame behind it. Cuke is also a very underwhelming card that is outclassed by other cards that do way more for the same cost. If the meme does nothing, don’t use it."
    ].join("\n"));
    const example2Thumbnail = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1312037763784376370/1407866190449348728/C1B37AF1-1401-40E1-9170-4A2580A3CCF4.png?ex=68a7a910&is=68a65790&hm=f381b32730ea90c1405d31d6194992c816386c5ec17e5be665f6cbeb520d41aa&=&format=webp&quality=lossless&width=771&height=770")
    const example2Section = new SectionBuilder().addTextDisplayComponents(examplesText3).setThumbnailAccessory(example2Thumbnail);
    examplesContainer.addSectionComponents(example2Section);
    examplesContainer.addActionRowComponents(selectRow);
    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter});
    collector.on("collect", async (interaction) => {
        if (interaction.customId === "selectGuide") {
            const value = interaction.values[0];
            if(value == "curve"){
                await interaction.update({
                    components: [curveContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }
            else if(value == "archetypes"){
                await interaction.update({
                    components: [archetypesContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }
            else if(value == "finishing_power"){
                await interaction.update({
                    components: [finishingPowerContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }
            else if(value == "removal_and_answers"){
                await interaction.update({
                    components: [removalAndAnswersContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }
              else if(value == "glossary") {
            await interaction.update({
                components: [glossaryContainer, glossaryMedia],
                flags: MessageFlags.IsComponentsV2
            });
        }
        else if(value == "superpowers_and_closing_thoughts"){
            await interaction.update({
                components: [superpowersAndClosingThoughtsContainer],
                flags: MessageFlags.IsComponentsV2
            });
    }
    else if(value == "examples"){
        await interaction.update({
            components: [examplesContainer],
            flags: MessageFlags.IsComponentsV2
        });
    }
}
})
}
}
