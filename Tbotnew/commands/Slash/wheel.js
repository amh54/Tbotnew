const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('Spin the wheel to get a random plant or zombie deck')
    .addIntegerOption(
        option => option
            .setName('number')
            .setDescription('Number of cards to put in deck')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40)
    )
    .addStringOption(
         option => option.setName('hero').setDescription('The hero of the wheel deck').addChoices(
        { name: "Captain Combustible", value: "Captain Combustible"},
        { name: "Chompzilla", value: "Chompzilla"}, 
        { name: "Citron/BC", value: "Citron/BC"}, 
        {name: "Grass Knuckles", value: "Grass Knuckles"}, 
        {name: "Green Shadow", value: "Green Shadow"},
        {name: "Night Cap", value: "Night Cap"},
        {name: "Rose", value: "Rose"},
        {name: "Solar Flare", value: "Solar Flare"},
        {name: "Spudow", value: "Spudow"}, 
        {name: "Wall Knight", value: "Wall Knight"}, 
        {name: "Brain Freeze", value: "Brain Freeze"}, 
        {name: "Electric Boogaloo", value: "Electric Boogaloo"},
        {name: "Huge Gigantacus/SB", value: "Huge Gigantacus/SB"},
        {name: "Impfinity", value: "Impfinity"}, 
        {name: "Immorticia", value: "Immorticia"}, 
        {name: "Neptuna", value: "Neptuna"}, 
        {name: "Rustbolt", value: "Rustbolt"}, 
        {name: "Professor Brainstorm", value: "Professor Brainstorm"}, 
        {name: "Smash", value: "Smash"}, 
        {name: "Zmech", value: "Zmech"},
      ).setRequired(true)),
      async execute(interaction) {
        try {
          await interaction.deferReply();
          
          const db = require('../../index.js');
          const number = interaction.options.getInteger('number');
          const hero = interaction.options.getString('hero');
          
          const results = await Promise.all([
            db.query('select card_name from guardiancards where set_rarity not like "%Token%" and description not like "%Superpower%"'), 
            db.query('select card_name from smartycards where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from kabloomcards where set_rarity not like "%Token%"'),
            db.query('select card_name from megagrowcards where set_rarity not like "%Token%"'),
            db.query('select card_name from solarcards where set_rarity not like "%Token%"'),
            db.query('select card_name from sneakycards where set_rarity not like "%Token%"'),
            db.query('select card_name from beastlycards where set_rarity not like "%Token%"'),
            db.query('select card_name from crazycards where set_rarity not like "%Token%"'),
            db.query('select card_name from brainycards where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from heartycards where set_rarity not like "%Token%"'),
            db.query('select card_name from guardiantricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from smartytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from kabloomtricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from megagrowtricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from solartricks where set_rarity not like "%Token%" and  description not like "%Superpower%"'),
            db.query('select card_name from sneakytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from beastlytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from crazytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from brainytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
            db.query('select card_name from heartytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
          ]);
          // Extract rows from mysql2 result format [rows, fields]
          const [guardianCards, smartyCards, kabloomCards, 
            megaGrowCards, solarCards, sneakyCards, beastlyCards, 
            crazyCards, brainyCards, heartyCards, guardianTricks, 
            smartyTricks, kabloomTricks, megaGrowTricks, solarTricks, 
            sneakyTricks, beastlyTricks, crazyTricks, brainyTricks, 
            heartyTricks] = results.map(result => result[0]);
          const gurdianWords = [
          ...guardianCards.map(row => row.card_name),
          ...guardianTricks.map(row => row.card_name)
        ];
        const smartyWords = [
         ...smartyCards.map(row => row.card_name), 
          ...smartyTricks.map(row => row.card_name)
        ];
        const kabloomWords = [
          ...kabloomCards.map(row => row.card_name), 
          ...kabloomTricks.map(row => row.card_name)
        ];
        const megaGrowWords = [
          ...megaGrowCards.map(row => row.card_name), 
          ...megaGrowTricks.map(row => row.card_name)
        ];
        const solarWords = [
          ...solarCards.map(row => row.card_name), 
          ...solarTricks.map(row => row.card_name)
        ];
        const sneakyWords = [
          ...sneakyCards.map(row => row.card_name), 
          ...sneakyTricks.map(row => row.card_name)
        ];
        const beastlyWords = [
         ...beastlyCards.map(row => row.card_name), 
          ...beastlyTricks.map(row => row.card_name)
        ];
        const crazyWords = [
        ...crazyCards.map(row => row.card_name),
        ...crazyTricks.map(row => row.card_name)
        ];
        const brainyWords = [
          ...brainyCards.map(row => row.card_name), 
          ...brainyTricks.map(row => row.card_name)
        ];
        const heartyWords = [
          ...heartyCards.map(row => row.card_name), 
          ...heartyTricks.map(row => row.card_name)
        ];
        const heroWordsMap = {
          // Beta Carrotina
          "Citron/BC": gurdianWords.concat(smartyWords),
          // Captain Combustible
          "Captain Combustible": kabloomWords.concat(megaGrowWords),
          // Chompzilla
          "Chompzilla": megaGrowWords.concat(solarWords),
          // Grass Knuckles
          "Grass Knuckles": gurdianWords.concat(megaGrowWords),
          // Green Shadow
          "Green Shadow": megaGrowWords.concat(smartyWords),
          // Nightcap
          "Night Cap": kabloomWords.concat(smartyWords),
          // Rose
          "Rose": smartyWords.concat(solarWords),
          // Solar Flare
          "Solar Flare": kabloomWords.concat(solarWords),
          // Spudow
          "Spudow": kabloomWords.concat(gurdianWords),
          // Wall-Knight
          "Wall Knight": gurdianWords.concat(solarWords),
          // Brain Freeze
          "Brain Freeze": sneakyWords.concat(beastlyWords),
          // Electric Boogaloo
          "Electric Boogaloo": beastlyWords.concat(crazyWords),
          // Huge-Gigantacus
          "Huge Gigantacus/SB": sneakyWords.concat(brainyWords),
          // Impfinity
        "Impfinity": sneakyWords.concat(crazyWords),
          // Immorticia
          "Immorticia": beastlyWords.concat(brainyWords),
          // Neptuna
          "Neptuna": sneakyWords.concat(heartyWords),
          // Professor Brainstorm
          "Professor Brainstorm": crazyWords.concat(brainyWords),
          // Rustbolt
          "Rustbolt": brainyWords.concat(heartyWords),
          // The Smash
          "Smash": beastlyWords.concat(heartyWords),
          // Z-Mech
          "Zmech": heartyWords.concat(crazyWords),
    };
        const wordsArray = heroWordsMap[hero];
        const randomWords = [];
                const remainingWords = [...wordsArray];
                for (let i = 0; i < number; i++) {
                  const randomIndex = Math.floor(Math.random() * remainingWords.length);
                  const selectedWord = remainingWords.splice(randomIndex, 1)[0];
                  randomWords.push(selectedWord);
                }
        
                // Create and send the embed
                const embed = new EmbedBuilder()
                  .setTitle(
                    `Wheel ${
                      hero.charAt(0).toUpperCase() + hero.slice(1)
                    } Deck`
                  )
                  .setDescription(
                    `Here is your wheel deck for ${hero}:\n**${randomWords.join(
                      "\n"
                    )}**`
                  )
                  .setColor("Random");
        
                await interaction.editReply({
                  embeds: [embed]
                });
        } catch (error) {
          console.error("Error in wheel command:", error);
          const errorMessage = { content: `An error occurred: ${error.message}` };
          
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage);
          } else {
            await interaction.reply({ ...errorMessage, ephemeral: true });
          }
        }
      }
}
