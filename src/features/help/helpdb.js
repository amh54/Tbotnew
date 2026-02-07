const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const createCategoryEmbed = require("../decks/createCategoryEmbed");
const buildDeckEmbed = require("../decks/buildDeckEmbed");
const buildNavRow = require("../decks/buildNavRow");

const HERO_MAP = {
  bcdecks: "Beta-Carrotina",
  ccdecks: "Captain Combustible",
  ctdecks: "Citron",
  czdecks: "Chompzilla",
  gkdecks: "Grass Knuckles",
  gsdecks: "Green Shadow",
  ncdecks: "Night Cap",
  rodecks: "Rose",
  sfdecks: "Solar Flare",
  spdecks: "Spudow",
  wkdecks: "Wall Knight",
  bfdecks: "Brain Freeze",
  ebdecks: "Electric Boogaloo",
  hgdecks: "Huge-Gigantacus",
  ifdecks: "Impfinity",
  imdecks: "Immorticia",
  ntdecks: "Neptuna",
  pbdecks: "Professor Brainstorm",
  rbdecks: "Rustbolt",
  sbdecks: "Super Brainz",
  smdecks: "The Smash",
  zmdecks: "Z-Mech",
};

const PLANT_TABLES = [
  "bcdecks",
  "ccdecks",
  "ctdecks",
  "czdecks",
  "gkdecks",
  "gsdecks",
  "ncdecks",
  "rodecks",
  "sfdecks",
  "spdecks",
  "wkdecks",
];

const ZOMBIE_TABLES = [
  "bfdecks",
  "ebdecks",
  "hgdecks",
  "ifdecks",
  "imdecks",
  "ntdecks",
  "pbdecks",
  "rbdecks",
  "sbdecks",
  "smdecks",
  "zmdecks",
];

const CATEGORIES = [
  "all",
  "comp",
  "budget",
  "ladder",
  "meme",
  "aggro",
  "combo",
  "control",
  "midrange",
  "tempo",
];

const PLANT_THUMB =
  "https://media.discordapp.net/attachments/1044626284346605588/1358437770829369404/image.png";
const ZOMBIE_THUMB =
  "https://media.discordapp.net/attachments/1044626284346605588/1358438184182092073/zombieicon.png";

function getHeroFromTable(table) {
  return HERO_MAP[table] || "Unknown";
}

function normalize(value) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

async function fetchDecksFromTable(db, table, type) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM ${table} ORDER BY name COLLATE utf8mb4_general_ci ASC`
    );

    return (rows || []).map((row) => {
      const rawType = (row.type || "").toString();
      const rawArch = (row.archetype || "").toString();
      return {
        id: row.deckID ?? null,
        name: row.name ?? row.deckID ?? "Unnamed",
        type: rawType,
        archetype: rawArch,
        cost: row.cost ?? row.deckcost ?? "",
        typeNorm: normalize(rawType),
        archetypeNorm: normalize(rawArch),
        description: row.description ?? "",
        image: row.image ?? null,
        creator: row.creator ?? "",
        raw: row,
        deckType: type,
        hero: getHeroFromTable(table),
        table,
      };
    });
  } catch (err) {
    console.error(`Error querying table ${table}:`, err);
    return [];
  }
}

function matchesCategory(deck, category) {
  if (category === "all") return true;
  if (category === "comp") {
    return (
      deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp")
    );
  }
  if (category === "budget") return deck.typeNorm.includes("budget");
  if (category === "ladder") return deck.typeNorm.includes("ladder");
  if (category === "meme") return deck.typeNorm.includes("meme");
  if (category === "aggro") return deck.archetypeNorm.includes("aggro");
  if (category === "combo") return deck.archetypeNorm.includes("combo");
  if (category === "control") return deck.archetypeNorm.includes("control");
  if (category === "midrange") return deck.archetypeNorm.includes("midrange");
  if (category === "tempo") return deck.archetypeNorm.includes("tempo");
  return false;
}

function buildDeckLists(plantDecks, zombieDecks) {
  const deckLists = {};
  for (const category of CATEGORIES) {
    deckLists[`plant_${category}`] = plantDecks
      .filter((row) => matchesCategory(row, category))
      .sort((a, b) => {
        const heroCompare = a.hero.localeCompare(b.hero);
        return heroCompare === 0
          ? a.name.localeCompare(b.name)
          : heroCompare;
      });

    deckLists[`zombie_${category}`] = zombieDecks
      .filter((row) => matchesCategory(row, category))
      .sort((a, b) => {
        const heroCompare = a.hero.localeCompare(b.hero);
        return heroCompare === 0
          ? a.name.localeCompare(b.name)
          : heroCompare;
      });
  }

  return deckLists;
}

function buildCategoryEmbeds(deckLists) {
  const categoryEmbeds = {};
  for (const category of CATEGORIES) {
    const plantDeckNames = deckLists[`plant_${category}`].map(
      (deck) => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`
    );
    const zombieDeckNames = deckLists[`zombie_${category}`].map(
      (deck) => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`
    );

    categoryEmbeds[`plant_${category}`] = createCategoryEmbed(
      "Plant",
      "#00FF00",
      category === "comp"
        ? "Competitive"
        : category.charAt(0).toUpperCase() + category.slice(1),
      plantDeckNames,
      deckLists[`plant_${category}`].length,
      PLANT_THUMB
    );

    categoryEmbeds[`zombie_${category}`] = createCategoryEmbed(
      "Zombie",
      "#8B008B",
      category === "comp"
        ? "Competitive"
        : category.charAt(0).toUpperCase() + category.slice(1),
      zombieDeckNames,
      deckLists[`zombie_${category}`].length,
      ZOMBIE_THUMB
    );
  }

  return categoryEmbeds;
}

function buildCategoryNavRow(categoryKey, listLength) {
  const firstIndex = 0;
  const lastIndex = Math.max(0, listLength - 1);
  const leftId = `nav_${categoryKey}_${lastIndex}${
    lastIndex === firstIndex ? "_alt" : ""
  }`;
  const rightId = `nav_${categoryKey}_${firstIndex}`;

  const leftBtn = new ButtonBuilder()
    .setCustomId(leftId)
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Primary);
  const rightBtn = new ButtonBuilder()
    .setCustomId(rightId)
    .setEmoji("➡️")
    .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(leftBtn, rightBtn);
}

async function sendInteractionReply(interaction, payload) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ ...payload, fetchReply: true });
  }

  return interaction.reply({ ...payload, fetchReply: true });
}

async function runHelpDb(interaction, selectedType) {
  const db = interaction.client.db || require("../../../index.js");
  const plantPromises = PLANT_TABLES.map((table) =>
    fetchDecksFromTable(db, table, "plant")
  );
  const zombiePromises = ZOMBIE_TABLES.map((table) =>
    fetchDecksFromTable(db, table, "zombie")
  );

  const [plantResults, zombieResults] = await Promise.all([
    Promise.all(plantPromises),
    Promise.all(zombiePromises),
  ]);

  const plantDecks = plantResults.flat();
  const zombieDecks = zombieResults.flat();
  const deckLists = buildDeckLists(plantDecks, zombieDecks);
  const categoryEmbeds = buildCategoryEmbeds(deckLists);

  const categoryKey = selectedType?.toLowerCase();
  if (!categoryKey || !deckLists[categoryKey]) {
    await sendInteractionReply(interaction, {
      content: "Invalid deck category.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const list = deckLists[categoryKey] || [];
  if (list.length === 0) {
    await sendInteractionReply(interaction, {
      content: "No decks in that category.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (list.length === 1 && typeof list[0] === "object") {
    const singleEmbed = buildDeckEmbed(list[0], "Random");
    await sendInteractionReply(interaction, { embeds: [singleEmbed] });
    return;
  }

  const categoryEmbed = categoryEmbeds[categoryKey];
  if (!categoryEmbed) {
    await sendInteractionReply(interaction, {
      content: "Category view is unavailable.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const actionRow = buildCategoryNavRow(categoryKey, list.length);
  const message = await sendInteractionReply(interaction, {
    embeds: [categoryEmbed],
    components: [actionRow],
  });

  const filter = (i) => i.user.id === interaction.user.id;
  const collector = message.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      if (!i.isButton()) {
        return i.reply({
          content: "Unsupported interaction.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (i.customId.startsWith("back_to_list_")) {
        const category = i.customId.replace("back_to_list_", "");
        const backList = deckLists[category] || [];
        const backEmbed = categoryEmbeds[category];
        if (!backEmbed || backList.length === 0) {
          return i.reply({
            content: "Category view is unavailable.",
            flags: MessageFlags.Ephemeral,
          });
        }
        const row = buildCategoryNavRow(category, backList.length);
        return i.update({ embeds: [backEmbed], components: [row] });
      }

      if (i.customId.startsWith("nav_")) {
        const parts = i.customId.split("_");
        const index = Number.parseInt(parts.at(-1), 10);
        const category = parts.slice(1, -1).join("_");
        const listForCategory = deckLists[category] || [];
        const normalizedIndex = Math.max(
          0,
          Math.min(index, listForCategory.length - 1)
        );

        if (!listForCategory[normalizedIndex]) {
          return i.reply({
            content: "Deck not found.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const deckEmbed = buildDeckEmbed(
          listForCategory[normalizedIndex],
          "Random"
        );
        const navRow = buildNavRow(
          category,
          normalizedIndex,
          listForCategory.length,
          [category]
        );
        return i.update({ embeds: [deckEmbed], components: [navRow] });
      }

      return i.reply({
        content: "Unknown button.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error(err);
      if (!i.replied && !i.deferred) {
        await i.reply({
          content: "An error occurred.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });
}

module.exports = { runHelpDb };
