const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

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

const CLASS_TRAIT_NAMES = {
  guardian: "Guardian",
  smarty: "Smarty",
  kabloom: "Kabloom",
  megaGrow: "Mega-Grow",
  solar: "Solar",
  sneaky: "Sneaky",
  beastly: "Beastly",
  crazy: "Crazy",
  brainy: "Brainy",
  hearty: "Hearty",
};

const HERO_NAMES = new Set([
  "captain combustible",
  "chompzilla",
  "citron",
  "beta-carrotina",
  "grass knuckles",
  "green shadow",
  "night cap",
  "rose",
  "solar flare",
  "spudow",
  "wall knight",
  "brain freeze",
  "electric boogaloo",
  "huge gigantacus",
  "super brainz",
  "impfinity",
  "immorticia",
  "neptuna",
  "professor brainstorm",
  "rustbolt",
  "smash",
  "zmech",
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function isHeroCard(row) {
  const cardName = normalizeText(row.card_name);
  const setRarity = normalizeText(row.set_rarity);

  if (HERO_NAMES.has(cardName)) {
    return true;
  }

  if (setRarity.includes("hero")) {
    return true;
  }

  return false;
}

function isSuperpowerCard(row) {
  const cardName = normalizeText(row.card_name);
  const description = normalizeText(row.description);
  const ability = normalizeText(row.ability);
  const setRarity = normalizeText(row.set_rarity);

  if (description.includes("superpower")) {
    return true;
  }

  if (ability.includes("superpower")) {
    return true;
  }

  if (setRarity.includes("superpower")) {
    return true;
  }

  if (cardName.includes("superpower")) {
    return true;
  }

  return false;
}

function shouldExcludeCard(row) {
  if (!row) {
    return true;
  }

  if (!String(row.card_name || "").trim()) {
    return true;
  }

  const setRarity = normalizeText(row.set_rarity);

  if (setRarity.includes("token")) {
    return true;
  }

  if (isHeroCard(row)) {
    return true;
  }

  if (isSuperpowerCard(row)) {
    return true;
  }

  return false;
}

async function loadCardSelections(db) {
  const result = await db.query(`
    SELECT
      card_name,
      stats,
      description,
      traits,
      side,
      card_type,
      set_rarity,
      ability
    FROM web_cards
  `);

  const rows = result.rows;

  const playableRows = rows.filter((row) => !shouldExcludeCard(row));

  const extractCost = (stats) => {
    if (!stats) {
      return 0;
    }

    const match = stats
      .toString()
      .trim()
      .match(/^(\d+)/);

    return match ? Number.parseInt(match[1], 10) : 0;
  };

  const getCardType = (row) => {
    const description = String(row.description || "")
      .trim()
      .toLowerCase();

    if (description.includes("environment")) {
      return "Environment";
    }

    if (description.includes("trick")) {
      return "Trick";
    }

    return "Minion";
  };

  const normalizeClass = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const hasClass = (cardType, expectedClass) => {
    if (!cardType || !expectedClass) {
      return false;
    }

    const expected = normalizeClass(expectedClass);

    const classes = String(cardType)
      .split(",")
      .map((value) => normalizeClass(value))
      .filter(Boolean);

    return classes.includes(expected);
  };

  const processRows = (cardRows, expectedSide, expectedClass) => {
    return cardRows
      .filter((row) => {
        const side = String(row.side || "")
          .trim()
          .toLowerCase();

        if (side !== expectedSide) {
          return false;
        }

        return hasClass(row.card_type, expectedClass);
      })
      .map((row) => ({
        card_name: row.card_name,
        cost: extractCost(row.stats),
        type: getCardType(row),
      }));
  };

  const plantRows = playableRows.filter(
    (row) =>
      String(row.side || "")
        .trim()
        .toLowerCase() === "plants",
  );

  const zombieRows = playableRows.filter(
    (row) =>
      String(row.side || "")
        .trim()
        .toLowerCase() === "zombie",
  );

  const selections = {
    guardian: processRows(plantRows, "plants", CLASS_TRAIT_NAMES.guardian),

    smarty: processRows(plantRows, "plants", CLASS_TRAIT_NAMES.smarty),

    kabloom: processRows(plantRows, "plants", CLASS_TRAIT_NAMES.kabloom),

    megaGrow: processRows(plantRows, "plants", CLASS_TRAIT_NAMES.megaGrow),

    solar: processRows(plantRows, "plants", CLASS_TRAIT_NAMES.solar),

    sneaky: processRows(zombieRows, "zombie", CLASS_TRAIT_NAMES.sneaky),

    beastly: processRows(zombieRows, "zombie", CLASS_TRAIT_NAMES.beastly),

    crazy: processRows(zombieRows, "zombie", CLASS_TRAIT_NAMES.crazy),

    brainy: processRows(zombieRows, "zombie", CLASS_TRAIT_NAMES.brainy),

    hearty: processRows(zombieRows, "zombie", CLASS_TRAIT_NAMES.hearty),
  };

  return selections;
}

async function getCardSelections(db) {
  const now = Date.now();

  if (
    cachedCardSelections &&
    now - cachedCardSelectionsAt < CARD_SELECTION_CACHE_TTL_MS
  ) {
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

function buildHeroFactionMap(cards) {
  return {
    "Citron/BC": [cards.guardian, cards.smarty],

    "Captain Combustible": [cards.kabloom, cards.megaGrow],

    Chompzilla: [cards.megaGrow, cards.solar],

    "Grass Knuckles": [cards.guardian, cards.megaGrow],

    "Green Shadow": [cards.megaGrow, cards.smarty],

    "Night Cap": [cards.kabloom, cards.smarty],

    Rose: [cards.smarty, cards.solar],

    "Solar Flare": [cards.kabloom, cards.solar],

    Spudow: [cards.kabloom, cards.guardian],

    "Wall Knight": [cards.guardian, cards.solar],

    "Brain Freeze": [cards.sneaky, cards.beastly],

    "Electric Boogaloo": [cards.beastly, cards.crazy],

    "Huge Gigantacus/SB": [cards.sneaky, cards.brainy],

    Impfinity: [cards.sneaky, cards.crazy],

    Immorticia: [cards.beastly, cards.brainy],

    Neptuna: [cards.sneaky, cards.hearty],

    "Professor Brainstorm": [cards.crazy, cards.brainy],

    Rustbolt: [cards.brainy, cards.hearty],

    Smash: [cards.beastly, cards.hearty],

    Zmech: [cards.hearty, cards.crazy],
  };
}

function selectRandomCardsWithMaxCopies(sourceArray, count, maxCopies = 4) {
  const remaining = sourceArray.flatMap((card) =>
    Array.from({ length: maxCopies }, () => card),
  );

  const selected = [];

  while (selected.length < count && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);

    selected.push(remaining.splice(randomIndex, 1)[0]);
  }

  return selected;
}

function getRandomFactionRatio(totalCards) {
  if (totalCards <= 1) {
    return {
      ratio1: totalCards,
      ratio2: 0,
    };
  }

  const ratio1 = Math.floor(Math.random() * (totalCards - 1)) + 1;

  return {
    ratio1,
    ratio2: totalCards - ratio1,
  };
}

function getCardCost(card) {
  return card.cost || 0;
}

function getCardType(card) {
  return card.type || "Minion";
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

  return cardOrder.map((name) => `${cardCounts[name]}x ${name}`);
}

function checkDeckConstraints(deck) {
  const EARLY_MIN = 14;
  const MID_MIN = 12;
  const LATE_MIN = 8;
  const MAX_ENVIRONMENTS = 8;
  const MAX_TRICKS = 12;

  let early = 0;
  let mid = 0;
  let late = 0;
  let environments = 0;
  let tricks = 0;

  for (const card of deck) {
    const cost = getCardCost(card);
    const type = getCardType(card);

    if (cost <= 2) {
      early++;
    } else if (cost <= 4) {
      mid++;
    } else {
      late++;
    }

    if (type === "Environment") {
      environments++;
    }

    if (type === "Trick") {
      tricks++;
    }
  }

  return {
    valid:
      early >= EARLY_MIN &&
      mid >= MID_MIN &&
      late >= LATE_MIN &&
      environments <= MAX_ENVIRONMENTS &&
      tricks <= MAX_TRICKS,

    early,
    mid,
    late,
    environments,
    tricks,
  };
}

function buildDeckWithConstraints(
  faction1Cards,
  faction2Cards,
  ratio1,
  ratio2,
) {
  const MAX_RETRIES = 50;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const deck = [
      ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),

      ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
    ];

    const constraints = checkDeckConstraints(deck);

    if (constraints.valid) {
      shuffleArray(deck);

      return {
        deck,
        ratio1,
        ratio2,
      };
    }
  }

  const deck = [
    ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),

    ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
  ];

  shuffleArray(deck);

  return {
    deck,
    ratio1,
    ratio2,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wheel")
    .setDescription("Spin the wheel to get a random plant or zombie deck")

    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Choose deck generation mode")
        .addChoices(
          {
            name: "Normal - Pick out number of cards to include",
            value: "normal",
          },
          {
            name: "Ratio - Generates random card ratios",
            value: "ratio",
          },
        )
        .setRequired(true),
    )

    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("The hero of the wheel deck")
        .addChoices(
          {
            name: "Captain Combustible",
            value: "Captain Combustible",
          },
          {
            name: "Chompzilla",
            value: "Chompzilla",
          },
          {
            name: "Citron/BC",
            value: "Citron/BC",
          },
          {
            name: "Grass Knuckles",
            value: "Grass Knuckles",
          },
          {
            name: "Green Shadow",
            value: "Green Shadow",
          },
          {
            name: "Night Cap",
            value: "Night Cap",
          },
          {
            name: "Rose",
            value: "Rose",
          },
          {
            name: "Solar Flare",
            value: "Solar Flare",
          },
          {
            name: "Spudow",
            value: "Spudow",
          },
          {
            name: "Wall Knight",
            value: "Wall Knight",
          },
          {
            name: "Brain Freeze",
            value: "Brain Freeze",
          },
          {
            name: "Electric Boogaloo",
            value: "Electric Boogaloo",
          },
          {
            name: "Huge Gigantacus/SB",
            value: "Huge Gigantacus/SB",
          },
          {
            name: "Impfinity",
            value: "Impfinity",
          },
          {
            name: "Immorticia",
            value: "Immorticia",
          },
          {
            name: "Neptuna",
            value: "Neptuna",
          },
          {
            name: "Rustbolt",
            value: "Rustbolt",
          },
          {
            name: "Professor Brainstorm",
            value: "Professor Brainstorm",
          },
          {
            name: "Smash",
            value: "Smash",
          },
          {
            name: "Zmech",
            value: "Zmech",
          },
        )
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Number of cards to put in deck (normal mode only)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(40),
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const db = require("../../../index.js");

      const mode = interaction.options.getString("mode");

      const hero = interaction.options.getString("hero");

      const number = interaction.options.getInteger("number");

      if (mode === "normal" && !number) {
        return await interaction.editReply({
          content:
            "❌ Number is required for normal mode. Usage: `/wheel mode:normal number:30 hero:Solar Flare`",
        });
      }

      const cards = await getCardSelections(db);

      const heroFactionMap = buildHeroFactionMap(cards);

      const factions = heroFactionMap[hero];

      if (!factions) {
        return await interaction.editReply({
          content: `❌ No faction mapping found for ${hero}.`,
        });
      }

      const [faction1Cards, faction2Cards] = factions;

      if (!faction1Cards?.length || !faction2Cards?.length) {
        return await interaction.editReply({
          content: `❌ Not enough card data was found for ${hero}.`,
        });
      }

      let deckCards;

      if (mode === "normal") {
        const { ratio1, ratio2 } = getRandomFactionRatio(number);

        const selected = [
          ...selectRandomCardsWithMaxCopies(faction1Cards, ratio1),

          ...selectRandomCardsWithMaxCopies(faction2Cards, ratio2),
        ];

        deckCards = formatDeckCards(selected);
      } else {
        const ratio1 = Math.floor(Math.random() * 30) + 5;

        const ratio2 = 40 - ratio1;

        const result = buildDeckWithConstraints(
          faction1Cards,
          faction2Cards,
          ratio1,
          ratio2,
        );

        deckCards = formatDeckCards(result.deck);
      }

      const deckTitle = `Wheel ${hero} Deck`;

      const cardList = deckCards.join("\n");

      const deckDescription = `Here is your wheel deck for ${hero}:\n**${cardList}**`;

      const embed = new EmbedBuilder()
        .setTitle(deckTitle)
        .setDescription(deckDescription)
        .setColor("Random");

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error in wheel command:", error);

      const errorMessage = {
        content: `An error occurred: ${error.message}`,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({
          ...errorMessage,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
