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
module.exports = {
    name: `keeporscrap`,
    aliases: [`kos`, `plantkeep`, `plantscrap`, `plantcraft`, `plantkos`, `plantrecycle`, `pkos`, 
        `zombiekeep`, `zombiescrap`, `zombiecraft`, `zombiekos`, `zombierecycle`, `zkos`, `zombiekeeporscrap`, 
        `plantkeeporscrap`, `sok`, `scraporkeep`, `scrap`, `zombiescraporkeep`],
    category: `Miscellaneous`,
    run: async (client, message, args) => {
        const container = new ContainerBuilder();
        const tierText1 = new TextDisplayBuilder().setContent([
          "# Keep or Scrap Created By <@256910306003910658>.",
          "[reddit post](https://www.reddit.com/r/PvZHeroes/comments/1mkf38s/keep_or_scrap_august_2025_explanation_below/#lightbox)"
        ].join("\n"));
        const user = await client.users.fetch("256910306003910658");
        const authorImage = new ThumbnailBuilder().setURL(user.displayAvatarURL());
        const authorSection = new SectionBuilder()
          .addTextDisplayComponents(tierText1)
          .setThumbnailAccessory(authorImage);
        container.addSectionComponents(authorSection);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
         const tierText2 = new TextDisplayBuilder().setContent([
                  "### Template", 
                  "- **TIERS ARE UNORDERED**",
                  "- **Craft** is a tier I'm bringing back, since it's now a lot more clear which cards are worth putting sparks towards", 
                  "- **Keep** is now two tiers; **Use** and **Keep**. **Use** means that a card is immediately helpful for budget decks while also being valuable to keep for later. **Keep** meanwhile means a card is worth keeping for decks that you'll make later once you own enough higher rarity cards", 
                  "- [tier list templates](https://www.reddit.com/r/PvZHeroes/comments/1lrx6l6/i_made_updated_tier_lists_for_every_class/)",
                  "- [Reddit Post](https://www.reddit.com/r/PvZHeroes/comments/1msgpme/updated_keep_or_scrap_august_2025_explanation/)"
                ].join("\n"));
                container.addTextDisplayComponents(tierText2);
                container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
        const select = new StringSelectMenuBuilder()
        .setCustomId('select')
        .setPlaceholder('Select a class to view Keep or Scrap')
        .addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel('Plant')
            .setValue('plantkeeporscrap'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Zombie')
            .setValue('zombiekeeporscrap')
        ]);
        const row = new ActionRowBuilder().addComponents(select);
        container.addActionRowComponents(row);
        message.channel.send({ components: [container], 
            flags: MessageFlags.IsComponentsV2, 
            allowedMentions: {
                            users: []
                        }});
        const zombieContainer = new ContainerBuilder();
        const tierText8 = new TextDisplayBuilder().setContent([
        "# Beastly",
        "- **Cyborg** in Keep since this card is not that good anymore. It's seeing less and less use due to it losing trades to 2-cost basic cards. Not that it sucks now, but you really don't need it on a budget", 
        "- **Hover-Goat**, **Hunting Grounds**, **Interstellar Bounty Hunter**, **Gargantuar-Throwing Gargantuar**, **Zombot 1000**, and **Fraidy Cat** are all Scrap now. They were all weak cards to recommend in the first place, and the meta shifting to Plant tempo has made cards like Maniacal and IBH way worse", 
        "- **Secret Agent** is now Keepable. It's not ran as often as before due to the aforementioned meta shift"
      ].join("\n"));
      const beastlyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406627010972745858/beastlykeep.webp?ex=68a326fd&is=68a1d57d&hm=a366029c8dee74588a8125235e45738a3dda7aeabe647e89a36be66397661c8d&=&format=webp&width=995&height=873")
      const beastlySection = new SectionBuilder()
        .addTextDisplayComponents(tierText8)
        .setThumbnailAccessory(beastlyImage);
      zombieContainer.addSectionComponents(beastlySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText9 = new TextDisplayBuilder().setContent([
        "# Brainy",
        "- **Teleportation Zombie** in Craft since it complements your budget decks very often. It's a Science body with great stats, Gravestone, and can teleport multiple zombies throughout the game or at once. Teleport is better sometimes, but you rarely see those opportunities on a budget since it cares a lot more about card quality and combos", 
        "- **Shield-Crusher Viking** is Use now. It's a decent budget option that does see use in max decks, so it's typically worth keeping",
      ].join("\n"));
      const brainyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406627194247315557/brainykeep.webp?ex=68a32728&is=68a1d5a8&hm=a8bf63648891c6d8957da6147aa2d4f7b93efc9b32fbe825ac16a8dffd52c226&=&format=webp&width=995&height=873")
      const brainySection = new SectionBuilder()
        .addTextDisplayComponents(tierText9)
        .setThumbnailAccessory(brainyImage);
      zombieContainer.addSectionComponents(brainySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText10 = new TextDisplayBuilder().setContent([
        "# Crazy",
        "- **Barrel of Deadbeards** in Keepable. It's super niche now since you just don't run it in aggro anymore. Other decks tend to not want BoD since Mission is weak and BoD itself messes with your tempo"
      ].join("\n"));
      const crazyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406627367946031115/crazykeep.webp?ex=68a32752&is=68a1d5d2&hm=269e0c4d6db1d78eebe1d62356ed69d692162d815701b725614b069d8b951a1e&=&format=webp")
      const crazySection = new SectionBuilder()
        .addTextDisplayComponents(tierText10)
        .setThumbnailAccessory(crazyImage);
      zombieContainer.addSectionComponents(crazySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText11 = new TextDisplayBuilder().setContent([
        "# Hearty",
        "- **Zombology Teacher** and **Genetic Experiment** are in Use. They were underrated at the time for being potentially outclassed by Hearty's new tempo options, but both are is still really useful",
        "- **Jurassic Fossilhead** and **All-Star Zombie** are Scrap. Colosseum, Sumo, and Primeval Yeti are all more important and useful cards, and once you've unlocked them, you're then putting sparks towards cards like Viral and Black Hole. Even if that wasn't the case, neither card really excels on a budget anyway, with All-Star being out-right bad without the support of the above cards", 
        "- **Weed Spray** and **Knockout** are Keepable. They're slow on a budget and not necessary to max nowadays, but are still valuable cards needed for certain strategies",
        "- **Battlecruiser** in Keepable as well. It's generally playable on a budget and sees a lot of use at max, so it's worth keeping if you don't need the sparks and are using Hearty a lot"
      ].join("\n"));
      const heartyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406627581004087449/heartykeep.webp?ex=68a32785&is=68a1d605&hm=ffee018a95e68ce5cce10c3b2468f0d81cbfa694d7cab978fcd977c72a4da4a8&=&format=webp")
      const heartySection = new SectionBuilder()
        .addTextDisplayComponents(tierText11)
        .setThumbnailAccessory(heartyImage);
      zombieContainer.addSectionComponents(heartySection);
      zombieContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText12 = new TextDisplayBuilder().setContent([
        "# Sneaky", 
        "- **Imp-Throwing Imp**, **Toxic Waste Imp**, and **Imposter** are Keepable now. Imps as a strategy is rarely ever played on other heroes besides HG anyway, and even on HG, they're relatively weaker due to Imp Commander's change", 
        "- **Laser Base Alpha** is Keepable. It's... fine, I guess. Usable on a budget if you have nothing better, and maxes out on Impfinity now", 
        "- **Mixed-Up Gravedigger** and **Pogo Bouncer** are now Keep and Use respectively. Pogo is a lot less niche of a card people had been giving it credit for up until now, while MUG has been seeing more use in these slower Sneaky decks", 
        "- **Zombot Plank Walker**, **Excavator Zombie**, and **Tomb Raiser Zombie** are all scrap. Plankwalker is hard to justify on a budget since Quarterly is so useful on SB and no other heroes can really use this card. Excavator was Keepable for Neptuna, but she hardly runs it now. Tomb Raiser was just overhyped, honestly; it's still an easily controllable 4-drop that needs to hit face to get value"
      ].join("\n"));
      const sneakyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406627761530867834/sneakykeep.webp?ex=68a327b0&is=68a1d630&hm=1bab002052eeb12538703afcf5ddeba6fe69b3c75d8533ea1a23ae6d1eaf3e97&=&format=webp")
      const sneakySection = new SectionBuilder()
        .addTextDisplayComponents(tierText12)
        .setThumbnailAccessory(sneakyImage);
      zombieContainer.addSectionComponents(sneakySection);
      zombieContainer.setAccentColor(10494192);
      const plantContainer = new ContainerBuilder(); 
      const tierText3 = new TextDisplayBuilder().setContent([
          "# Guardian",
          "- **Pecanolith** is now Scrap. Gravitree is better top-end that ends up being more lethal without backfire. It was Keepable before Quarterly fix, now it's not worth it", 
          "- **Hot Date** is Keep tier. It was put in Keepable before since it wasn't useful on a budget, but Keep tier is now fitting for the card's limits", 
          "- **Body-Gourd** and **Soul Patch** are Keepable now. Recent buffs made then a lot more runnable. Soul Patch is a weaker Poppies, not saying it's bad", 
          "- **Pear Cub** and **Red Stinger** are Use. Recent buffs have made them much more ideal to use"
        ].join("\n"));
        const guardianImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406625953924513933/guardiankeep.webp?ex=68a32601&is=68a1d481&hm=622aa2cad975b860a40ff1bb252f35168402cd5533e39cc63069f96c2779a9d5&=&format=webp")
        const guardianSection = new SectionBuilder()
          .addTextDisplayComponents(tierText3)
          .setThumbnailAccessory(guardianImage);
          plantContainer.addSectionComponents(guardianSection);
       plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
        const tierText4 = new TextDisplayBuilder().setContent([
          "# Kabloom",
          "- **Banana Launcher**, **Reincarnation**, **Pineclone**, and **Gloom-Shroom** are Scrap. Gloom and Pineclone were already bad cards that stopped being useful as budget options due to power-creep. Blauncher and Reincarnation are too niche to keep on a budget. You typically either want better aggro options or more sparks to put towards Fig", 
          "- **Astro-Shroom** is just Keepable now. A fine budget option and you still want it for Cycle Cap, but Nightcap at max is a lot more flexible and other heroes just don't bother with this card", 
          "- **Fireweed** in Keep since it's used in most of Kabloom decks nowadays, due to the class having a slower pace nowadays and wanting the control and value it brings. You can scrap it if you need the sparks and have no plans for using Kabloom heroes, but they all want this card (yes, even Nightcap likes this card sometimes)"
        ].join("\n"));
        const kabloomImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406626184451592372/kabloomkeep.webp?ex=68a32638&is=68a1d4b8&hm=de66193cd1116b5b6f991dc0bc19bbfdd726f112cd1cd4660be9324cfbdbb812&=&format=webp&width=995&height=873")
        const kabloomSection = new SectionBuilder()
          .addTextDisplayComponents(tierText4)
          .setThumbnailAccessory(kabloomImage);
        plantContainer.addSectionComponents(kabloomSection);
   plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText5 = new TextDisplayBuilder().setContent([
        "# Mega-Grow", 
        "- **Espresso Fiesta** is Craft now. The card is genuinely broken on some heroes, and it's generally really good now", 
        "- **Lily of the Valley** and **Apotatosaurus** are now Keep and Use respectively. **Apotato** is good top-end that can help finish games, while **Lily** is more consistently good in decks 10k sparks and up after its buff",
         "-  **Spinach** is Keepable now, since a lot of Leafy cards got buffs. It's like a more versatile Onion Rings with weaker effects", 
        "- **Black-Eyed Pea** is Scrap now. Card is genuinely not good anymore ever since Cabbage got its buff. Pea Patch also takes its spot in decks, and Umbrella being more playable means BEP isn't necessary for trick tech", 
      ].join("\n"));
      const megaGrowImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406626381072306176/megagrowkeep.webp?ex=68a32667&is=68a1d4e7&hm=ad2ee8e28730eb6bce897ea66f9608a6325d319bdab66d04d1697a4db70a1dcb&=&format=webp")
      const megaGrowSection = new SectionBuilder()
        .addTextDisplayComponents(tierText5)
        .setThumbnailAccessory(megaGrowImage);
      plantContainer.addSectionComponents(megaGrowSection);
   plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText6 = new TextDisplayBuilder().setContent([
        "# Smarty", 
        "- **Laser Cattail** is Keep, it's actually a good on a budget. It's versatile, relevant to budget strategies, and leads to strong decks",
        "- **Sportacus** in Scrap, generally underperforms, even in aggro, and Smarty has better tempo options now", 
        "- **Dark Matter Dragonfruit** in Keep, as Smarty has more of a focus on midrange and control than before", 
        "- **Winter Melon** and **Snapdragon** are Keepable since they're good board control that get used competitively and are okay on a budget. Winter doesn't fall into the same traps less effective 6-drops do since it at least does something when played and actively supports strong boards. Snapdragon overall is a fine card that similarly supports your boards with Splash Damage"
      ].join("\n"));
      const smartyImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406626601143369759/smartykeep.webp?ex=68a3269b&is=68a1d51b&hm=885e02855ea36b6252dee2b6deaed90ae4836484d309dbf027d7faec58d135ef&=&format=webp&width=399&height=350")
      const smartySection = new SectionBuilder()
        .addTextDisplayComponents(tierText6)
        .setThumbnailAccessory(smartyImage);
      plantContainer.addSectionComponents(smartySection);
      plantContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
      const tierText7 = new TextDisplayBuilder().setContent([
        "# Solar", 
        "- **Sun-Shroom is craft**. Card's busted", 
        "- **Aloesaurus** and **Wing-Nut** are Scrap. Similar to Pecan, they were really only recommended for the meta at that time. Aloe made up for the lack of lethality Solar had, while Wing-Nut was a simple answer to Quarterly. Both cards are completely unnecessary to keep now", 
        "- **Cross-Pollination** and **Taco** are Keepable since slower decks like the sustain and have niche use at max. Not that useful on a budget, but can be valuable to have for certain strategies", 
        "- **Briar** is still Scrap, still worth 4k sparks"
      ].join("\n"));
      const solarImage = new ThumbnailBuilder().setURL("https://media.discordapp.net/attachments/1044626284346605588/1406626808060973056/smartykeep.webp?ex=68a326cc&is=68a1d54c&hm=672e954669a47f62bb2a06e2194648e2e3627fc86baedc6e018727d04edbb812&=&format=webp&width=991&height=873")
      const solarSection = new SectionBuilder()
        .addTextDisplayComponents(tierText7)
        .setThumbnailAccessory(solarImage);
      plantContainer.addSectionComponents(solarSection);
      plantContainer.setAccentColor(65280);
        const collector = message.channel.createMessageComponentCollector({});
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'select') {
                if (interaction.values[0] === 'plantkeeporscrap') {
                    await interaction.reply({
                        components: [plantContainer],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    });
                }
                else if (interaction.values[0] === 'zombiekeeporscrap') {
                    await interaction.reply({
                        components: [zombieContainer],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    });
                }
            }
        });
    }
};
