const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");

// Helper function to extract card names from query results
function extractCardNames(cardRows, trickRows) {
  return [...cardRows.map(row => row.card_name), ...trickRows.map(row => row.card_name)];
}

// Helper function to fetch all cards from database
async function getCardSelections(db) {
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
    db.query('select card_name from solartricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
    db.query('select card_name from sneakytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
    db.query('select card_name from beastlytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
    db.query('select card_name from crazytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
    db.query('select card_name from brainytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
    db.query('select card_name from heartytricks where set_rarity not like "%Token%" and description not like "%Superpower%"'),
  ]);
  
  const [guardianCards, smartyCards, kabloomCards, megaGrowCards, solarCards, sneakyCards, 
    beastlyCards, crazyCards, brainyCards, heartyCards, guardianTricks, smartyTricks, 
    kabloomTricks, megaGrowTricks, solarTricks, sneakyTricks, beastlyTricks, 
    crazyTricks, brainyTricks, heartyTricks] = results.map(result => result[0]);
  
  return {
    guardian: extractCardNames(guardianCards, guardianTricks),
    smarty: extractCardNames(smartyCards, smartyTricks),
    kabloom: extractCardNames(kabloomCards, kabloomTricks),
    megaGrow: extractCardNames(megaGrowCards, megaGrowTricks),
    solar: extractCardNames(solarCards, solarTricks),
    sneaky: extractCardNames(sneakyCards, sneakyTricks),
    beastly: extractCardNames(beastlyCards, beastlyTricks),
    crazy: extractCardNames(crazyCards, crazyTricks),
    brainy: extractCardNames(brainyCards, brainyTricks),
    hearty: extractCardNames(heartyCards, heartyTricks),
  };
}

// Helper function to build hero faction mappings
function buildHeroFactionMap(cards) {
  return {
    "Citron/BC": [cards.guardian, cards.smarty],
    "Captain Combustible": [cards.kabloom, cards.megaGrow],
    "Chompzilla": [cards.megaGrow, cards.solar],
    "Grass Knuckles": [cards.guardian, cards.megaGrow],
    "Green Shadow": [cards.megaGrow, cards.smarty],
    "Night Cap": [cards.kabloom, cards.smarty],
    "Rose": [cards.smarty, cards.solar],
    "Solar Flare": [cards.kabloom, cards.solar],
    "Spudow": [cards.kabloom, cards.guardian],
    "Wall Knight": [cards.guardian, cards.solar],
    "Brain Freeze": [cards.sneaky, cards.beastly],
    "Electric Boogaloo": [cards.beastly, cards.crazy],
    "Huge Gigantacus/SB": [cards.sneaky, cards.brainy],
    "Impfinity": [cards.sneaky, cards.crazy],
    "Immorticia": [cards.beastly, cards.brainy],
    "Neptuna": [cards.sneaky, cards.hearty],
    "Professor Brainstorm": [cards.crazy, cards.brainy],
    "Rustbolt": [cards.brainy, cards.hearty],
    "Smash": [cards.beastly, cards.hearty],
    "Zmech": [cards.hearty, cards.crazy],
  };
}

// Helper function to select random cards from an array
function selectRandomCards(sourceArray, count) {
  const remaining = [...sourceArray];
  const selected = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }
  return selected;
}

// Helper function to shuffle array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to generate random ratio (sum to 40)
function generateRandomRatio() {
  const ratio1 = Math.floor(Math.random() * 30) + 5; // 5-34
  const ratio2 = 40 - ratio1; // 6-35
  return [ratio1, ratio2];
}

// Helper function to build deck with multipliers
function buildDeckWithMultipliers(faction1Words, faction2Words, ratio1, ratio2) {
  const deck = [];
  let remaining = 40;
  
  // Faction 1
  const f1Remaining = [...faction1Words];
  shuffleArray(f1Remaining);
  let f1Count = 0;
  for (const card of f1Remaining) {
    if (f1Count >= ratio1) break;
    const multiplier = Math.min(Math.floor(Math.random() * 4) + 1, ratio1 - f1Count);
    deck.push({ card, multiplier });
    f1Count += multiplier;
  }
  
  // Faction 2
  const f2Remaining = [...faction2Words];
  shuffleArray(f2Remaining);
  let f2Count = 0;
  for (const card of f2Remaining) {
    if (f2Count >= ratio2) break;
    const multiplier = Math.min(Math.floor(Math.random() * 4) + 1, ratio2 - f2Count);
    deck.push({ card, multiplier });
    f2Count += multiplier;
  }
  
  // Shuffle final deck
  shuffleArray(deck);
  return deck;
}

// Helper function to build deck based on mode
function buildDeck(mode, wordsArray, faction1Words, faction2Words, faction1Ratio, faction2Ratio) {
  if (mode === 'normal') {
    return selectRandomCards(wordsArray, wordsArray.length).map(card => ({ card, multiplier: 1 }));
  }
  
  const [ratio1, ratio2] = generateRandomRatio();
  return buildDeckWithMultipliers(faction1Words, faction2Words, ratio1, ratio2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('Spin the wheel to get a random plant or zombie deck')
    .addStringOption(
        option => option
            .setName('mode')
            .setDescription('Choose deck generation mode')
            .addChoices(
              { name: 'Normal - Pick out number of cards to include', value: 'normal' },
              { name: 'Ratio - Generates random card ratios', value: 'ratio' }
            )
            .setRequired(true)
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
      ).setRequired(true))
    .addIntegerOption(
        option => option
            .setName('number')
            .setDescription('Number of cards to put in deck (normal mode only)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(40)
    ),
      async execute(interaction) {
        try {
          await interaction.deferReply();
          
          const db = require('../../../index.js');
          const mode = interaction.options.getString('mode');
          const hero = interaction.options.getString('hero');
          const number = interaction.options.getInteger('number');
          
          // Validate inputs
          if (mode === 'normal' && !number) {
            return await interaction.editReply({ content: '❌ Number is required for normal mode. Usage: `/wheel mode:normal number:30 hero:Solar Flare`' });
          }
          
          // Get card selections from database
          const cards = await getCardSelections(db);
          const heroFactionMap = buildHeroFactionMap(cards);
          const [faction1Words, faction2Words] = heroFactionMap[hero];
          const wordsArray = [...faction1Words, ...faction2Words];
          
          // Build deck based on mode
          let deckCards;
          
          if (mode === 'normal') {
            deckCards = selectRandomCards(wordsArray, number).map(card => ({ card, multiplier: 1 }));
          } else {
            const [ratio1, ratio2] = generateRandomRatio();
            deckCards = buildDeckWithMultipliers(faction1Words, faction2Words, ratio1, ratio2);
          }
          
          // Build and send embed
          const capitalizedHero = hero.charAt(0).toUpperCase() + hero.slice(1);
          const deckTitle = `Wheel ${capitalizedHero} Deck`;
          const cardList = deckCards.map(item => `${item.multiplier}x ${item.card}`).join("\n");
          const deckDescription = `Here is your wheel deck for ${hero}:\n**${cardList}**`;
          
          const embed = new EmbedBuilder()
            .setTitle(deckTitle)
            .setDescription(deckDescription)
            .setColor("Random");
          
          await interaction.editReply({ embeds: [embed] });
          
        } catch (error) {
          console.error("Error in wheel command:", error);
          const errorMessage = { content: `An error occurred: ${error.message}` };
          
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage);
          } else {
            await interaction.reply({ ...errorMessage, flags: MessageFlags.Ephemeral });
          }
        }
      }
}
