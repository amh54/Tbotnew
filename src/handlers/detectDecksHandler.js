const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

const createCategoryEmbed = require("../features/decks/createCategoryEmbed.js");
const buildDeckEmbed = require("../features/decks/buildDeckEmbed.js");
const collectDecksWithCard = require("../features/cards/collectDecksWithCard.js");
const categorizeDecks = require("../features/decks/categorizeDecks.js");
const createCategorySelectMenu = require("../features/decks/createCategorySelectMenu.js");
const calculateNavIndices = require("../features/decks/calculateNavIndices.js");
const buildNavigationRow = require("../features/decks/buildNavigationRow.js");

function buildDeckListNavRow(category, listLength) {
  if (listLength <= 1) {
    return null;
  }

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_${listLength - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary),
  );
}

async function startDetectDecksByName(interaction, db, cardNames) {
  const requestedCards = Array.isArray(cardNames)
    ? cardNames.filter(Boolean)
    : [cardNames].filter(Boolean);

  if (requestedCards.length === 0) {
    return interaction.reply({
      content: "Please provide at least one card to search for.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const cardLabel = requestedCards.join(" + ");

  await interaction.deferReply();

  const allDecks = await collectDecksWithCard(db, requestedCards);

  if (allDecks.length === 0) {
    return interaction.editReply({
      content: `No decks found containing "${cardLabel}".`,
    });
  }

  const { availableCategories, deckLists } = categorizeDecks(allDecks);

  const select = createCategorySelectMenu(
    cardLabel,
    availableCategories,
    deckLists,
  );

  const initialEmbed = new EmbedBuilder()
    .setTitle(`Decks containing "${cardLabel}"`)
    .setColor("Blue")
    .setDescription(
      [
        `Found **${allDecks.length}** deck(s) containing **${cardLabel}**`,
        "",
        "Select a category below to browse the decks with navigation.",
        "Use the select menu to filter by category",
      ].join("\n"),
    );

  const message = await interaction.editReply({
    embeds: [initialEmbed],
    components: [new ActionRowBuilder().addComponents(select)],
  });

  if (!interaction.client.detectDecksData) {
    interaction.client.detectDecksData = new Map();
  }

  interaction.client.detectDecksData.set(message.id, {
    userId: interaction.user.id,
    cardName: cardLabel,
    deckLists,
    availableCategories,
  });
}

async function handleDetectDecks(interaction, db) {
  const cardName = interaction.customId.replace("detectdecks_", "");

  if (!interaction.customId.startsWith("detectdecks_")) {
    return false;
  }

  await startDetectDecksByName(interaction, db, cardName);
  return true;
}

async function handleDetectDecksNavigation(interaction, messageId, client) {
  if (!client?.detectDecksData) {
    return false;
  }

  let data = client.detectDecksData.get(messageId);

  if (!data) {
    const userFallback = [...client.detectDecksData.values()].find(
      (entry) => entry.userId === interaction.user.id
    );

    if (userFallback) {
      data = userFallback;
    }
  }

  if (!data) {
    return interaction.reply({
      content: "Data expired. Please run the command again.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("deckcat_")
  ) {
    return handleCategorySelect(interaction, data);
  }

  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("decknav_") ||
      interaction.customId.startsWith("decklist_"))
  ) {
    return handleDeckNavigation(interaction, data);
  }
}

function buildCardSearchDeckListEmbed(cardName, list) {
  const deckLines = list.map((deck) => {
    const normalizedName = String(deck.name || "Unknown")
      .replaceAll(/\s+/gu, "")
      .toLowerCase();
    const hero = deck.hero ? ` (${deck.hero})` : "";
    return `**${normalizedName}**${hero}`;
  });

  return new EmbedBuilder()
    .setTitle(`${cardName} Decks`)
    .setColor("Blue")
    .setDescription(
      [
        `All **${cardName}** decks in Tbot are:`,
        ...deckLines,
        `**${cardName}** has ${list.length} total decks in Tbot`,
        "Please click on the buttons below to navigate through the decks.",
      ].join("\n"),
    );
}

async function handleCategorySelect(interaction, data) {
  const category = interaction.values[0];

  const list = data.deckLists[category] || [];

  if (list.length === 0) {
    return interaction.reply({
      content: "No decks in that category.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (list.length === 1) {
    const deckEmbed = buildDeckEmbed(list[0], "Blue");
    if (interaction.client?.detectDecksData) {
      await interaction.reply({
        embeds: [deckEmbed],
        flags: MessageFlags.Ephemeral,
      });

      const reply = await interaction.fetchReply();
      interaction.client.detectDecksData.set(reply.id, {
        ...data,
        userId: interaction.user.id,
        currentCategory: category,
        currentList: list,
      });
      interaction.client.detectDecksData.set(interaction.message.id, {
        ...data,
        userId: interaction.user.id,
        currentCategory: category,
        currentList: list,
      });
      return;
    }
    return interaction.update({
      embeds: [deckEmbed],
      components: [],
    });
  }

  const categoryEmbed = buildCardSearchDeckListEmbed(data.cardName, list);
  const navRow = buildDeckListNavRow(category, list.length);

  if (interaction.client?.detectDecksData) {
    await interaction.reply({
      embeds: [categoryEmbed],
      components: [navRow],
      flags: MessageFlags.Ephemeral,
    });

    const reply = await interaction.fetchReply();
    interaction.client.detectDecksData.set(reply.id, {
      ...data,
      userId: interaction.user.id,
      currentCategory: category,
      currentList: list,
    });
    interaction.client.detectDecksData.set(interaction.message.id, {
      ...data,
      userId: interaction.user.id,
      currentCategory: category,
      currentList: list,
    });
    return;
  }

  return interaction.update({
    embeds: [categoryEmbed],
    components: [navRow],
  });
}

async function handleDeckNavigation(interaction, data) {
  if (interaction.customId.startsWith("decklist_")) {
    let category = interaction.customId.replace("decklist_", "");
    if (category.endsWith("_start") || category.endsWith("_end")) {
      category = category.replace(/_(start|end)$/u, "");
    }
    const list = data.deckLists[category] || [];

    if (list.length === 0) {
      return interaction.reply({
        content: "No decks in that category.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const categoryEmbed = buildCardSearchDeckListEmbed(data.cardName, list);
    const navRow = buildDeckListNavRow(category, list.length);

    return interaction.update({
      embeds: [categoryEmbed],
      components: [navRow],
    });
  }

  const parts = interaction.customId.split("_");
  let indexString = parts.at(-1);
  let category = parts.slice(1, -1).join("_");

  if (indexString === "prev" || indexString === "next") {
    indexString = parts.at(-2);
    category = parts.slice(1, -2).join("_");
  }

  const index = Number.parseInt(indexString, 10);
  const list = data.deckLists[category] || [];

  if (!list[index]) {
    return interaction.reply({
      content: "Deck not found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = buildDeckEmbed(list[index], "Blue");
  const prevIndex = index === 0 ? "list" : index - 1;
  const nextIndex = index === list.length - 1 ? "list" : index + 1;
  const navRow = buildNavigationRow(category, prevIndex, nextIndex, "decknav", "decklist");

  return interaction.update({
    embeds: [embed],
    components: [navRow],
  });
}

module.exports = {
  handleDetectDecks,
  startDetectDecksByName,
  handleDetectDecksNavigation,
};
