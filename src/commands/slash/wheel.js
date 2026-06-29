const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");

// Helper function to shuffle array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const CARD_SELECTION_CACHE_TTL_MS = 15 * 60 * 1000;
let cachedCardSelections = null;
let cachedCardSelectionsAt = 0;
let pendingCardSelections = null;

const CARD_SELECTION_QUERIES = [
  { key: "guardianCards", query: 'select card_name, stats from guardiancards where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "smartyCards", query: 'select card_name, stats from smartycards where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "kabloomCards", query: 'select card_name, stats from kabloomcards where set_rarity not like "%Token%"' },
  { key: "megaGrowCards", query: 'select card_name, stats from megagrowcards where set_rarity not like "%Token%"' },
  { key: "solarCards", query: 'select card_name, stats from solarcards where set_rarity not like "%Token%"' },
  { key: "sneakyCards", query: 'select card_name, stats from sneakycards where set_rarity not like "%Token%"' },
  { key: "beastlyCards", query: 'select card_name, stats from beastlycards where set_rarity not like "%Token%"' },
  { key: "crazyCards", query: 'select card_name, stats from crazycards where set_rarity not like "%Token%"' },
  { key: "brainyCards", query: 'select card_name, stats from brainycards where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "heartyCards", query: 'select card_name, stats from heartycards where set_rarity not like "%Token%"' },
  { key: "guardianTricks", query: 'select card_name, stats, description from guardiantricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "smartyTricks", query: 'select card_name, stats, description from smartytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "kabloomTricks", query: 'select card_name, stats, description from kabloomtricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "megaGrowTricks", query: 'select card_name, stats, description from megagrowtricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "solarTricks", query: 'select card_name, stats, description from solartricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "sneakyTricks", query: 'select card_name, stats, description from sneakytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "beastlyTricks", query: 'select card_name, stats, description from beastlytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "crazyTricks", query: 'select card_name, stats, description from crazytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "brainyTricks", query: 'select card_name, stats, description from brainytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
  { key: "heartyTricks", query: 'select card_name, stats, description from heartytricks where set_rarity not like "%Token%" and description not like "%Superpower%"' },
];

async function loadCardSelections(db) {
  const rowsByKey = {};
  for (const selectionQuery of CARD_SELECTION_QUERIES) {
    const [rows] = await db.query(selectionQuery.query);
    rowsByKey[selectionQuery.key] = rows;
  }

  const {
    guardianCards,
    smartyCards,
    kabloomCards,
    megaGrowCards,
    solarCards,
    sneakyCards,
    beastlyCards,
    crazyCards,
    brainyCards,
    heartyCards,
    guardianTricks,
    smartyTricks,
    kabloomTricks,
    megaGrowTricks,
    solarTricks,
    sneakyTricks,
    beastlyTricks,
    crazyTricks,
    brainyTricks,
    heartyTricks
  } = rowsByKey;
  
  // Helper to extract cost from stats string (Discord emoji format)
  const extractCost = (stats) => {
    if (!stats) return 0;
    const match = stats.toString().trim().match(/^(\d+)/);
    return match ? Number.parseInt(match[1], 10) : 0;
  };
  
  // Helper to determine trick type from description
  const getTrickType = (description) => {
    if (!description) return 'Trick';
    return description.includes('Environment') ? 'Environment' : 'Trick';
  };
  
  // Process card tables (minions/spells)
  const processCardTable = (cards) => 
    cards.map(row => ({ card_name: row.card_name, cost: extractCost(row.stats), type: 'Minion' }));
  
   // Process trick tables
  const processTrickTable = (tricks) => 
    tricks.map(row => ({ card_name: row.card_name, cost: extractCost(row.stats), type: getTrickType(row.description) }));
  return {
    guardian: [...processCardTable(guardianCards), ...processTrickTable(guardianTricks)],
    smarty: [...processCardTable(smartyCards), ...processTrickTable(smartyTricks)],
    kabloom: [...processCardTable(kabloomCards), ...processTrickTable(kabloomTricks)],
    megaGrow: [...processCardTable(megaGrowCards), ...processTrickTable(megaGrowTricks)],
    solar: [...processCardTable(solarCards), ...processTrickTable(solarTricks)],
    sneaky: [...processCardTable(sneakyCards), ...processTrickTable(sneakyTricks)],
    beastly: [...processCardTable(beastlyCards), ...processTrickTable(beastlyTricks)],
    crazy: [...processCardTable(crazyCards), ...processTrickTable(crazyTricks)],
    brainy: [...processCardTable(brainyCards), ...processTrickTable(brainyTricks)],
    hearty: [...processCardTable(heartyCards), ...processTrickTable(heartyTricks)],
  };
}

// Helper function to fetch all cards from database with costs and types
async function getCardSelections(db) {
  const now = Date.now();
  if (cachedCardSelections && now - cachedCardSelectionsAt < CARD_SELECTION_CACHE_TTL_MS) {
    return cachedCardSelections;
  }

  if (!pendingCardSelections) {
    pendingCardSelections = loadCardSelections(db)
      .then((cardSelections) => {
        cachedCardSelections = cardSelections;
        cachedCardSelectionsAt = Date.now();
        return cardSelections;
      })
      .finally(() => {
        pendingCardSelections = null;
      });
  }

  return pendingCardSelections;
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

// Helper function to select random cards with a maximum copy count
function selectRandomCardsWithMaxCopies(sourceArray, count, maxCopies = 4) {
  const remaining = sourceArray.flatMap(card => Array.from({ length: maxCopies }, () => card));
  const selected = [];

  while (selected.length < count && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }

  return selected;
}

function getRandomFactionRatio(totalCards) {
  if (totalCards <= 1) {
    return { ratio1: totalCards, ratio2: 0 };
  }

  const ratio1 = Math.floor(Math.random() * (totalCards - 1)) + 1;
  return { ratio1, ratio2: totalCards - ratio1 };
}

function formatDeckCards(deck) {
  deck.sort((a, b) => getCardCost(a) - getCardCost(b));

  const cardCounts = {};
  const cardOrder = [];
  for (const card of deck) {
    if (!cardCounts[card.card_name]) {
      cardOrder.push(card.card_name);
    }
    cardCounts[card.card_name] = (cardCounts[card.card_name] || 0) + 1;
  }

  return cardOrder.map(name => `${cardCounts[name]}x ${name}`);
}

// Helper function to get card cost
function getCardCost(card) {
  return card.cost || 0;
}

// Helper function to get card type
function getCardType(card) {
  return card.type || 'Minion';
}

// Helper function to check if deck meets constraints
function checkDeckConstraints(deck) {
  const EARLY_MIN = 14;   // min 1-2 drops
  const MID_MIN = 12;     // min 3-4 drops
  const LATE_MIN = 8;     // min 5+ drops
  const MAX_ENVIRONMENTS = 8;
  const MAX_TRICKS = 12;
  
  let early = 0, mid = 0, late = 0;
  let environments = 0, tricks = 0;
  
  for (const card of deck) {
    const cost = getCardCost(card);
    const type = getCardType(card);
    
    if (cost <= 2) early++;
    else if (cost <= 4) mid++;
    else late++;
    
    if (type === 'Environment') environments++;
    if (type === 'Trick') tricks++;
  }
  
  return {
    valid: early >= EARLY_MIN && mid >= MID_MIN && late >= LATE_MIN && 
           environments <= MAX_ENVIRONMENTS && tricks <= MAX_TRICKS,
    early, mid, late, environments, tricks
  };
}

// Helper function to build deck with independent draws and constraints
function buildDeckWithConstraints(faction1Cards, faction2Cards, ratio1, ratio2) {
  const MAX_RETRIES = 50;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const deck = [
      ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),
      ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
    ];
    
    // Check constraints
    const constraints = checkDeckConstraints(deck);
    if (constraints.valid) {
      shuffleArray(deck);
      return { deck, ratio1, ratio2 };
    }
  }
  
 // If we fail all retries, return best attempt
  const deck = [
    ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),
    ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
  ];
  shuffleArray(deck);
  return { deck, ratio1, ratio2 };
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
          const [faction1Cards, faction2Cards] = heroFactionMap[hero];
          
          // Build deck based on mode
          let deckCards;
          
          if (mode === 'normal') {
            // Normal mode: user chooses deck size, then cards are drawn with copies using a random faction ratio.
            const { ratio1, ratio2 } = getRandomFactionRatio(number);
            const selected = [
              ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),
              ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
            ];
            deckCards = formatDeckCards(selected);
          } else {
            // Ratio mode: generate random ratio and build constrained deck
            const ratio1 = Math.floor(Math.random() * 30) + 5; // 5-34
            const ratio2 = 40 - ratio1;
            const result = buildDeckWithConstraints(faction1Cards, faction2Cards, ratio1, ratio2);
            deckCards = formatDeckCards(result.deck);
          }
          
          // Build and send embed
          const capitalizedHero = hero.charAt(0).toUpperCase() + hero.slice(1);
          const deckTitle = `Wheel ${capitalizedHero} Deck`;
          const cardList = deckCards.join("\n");
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
