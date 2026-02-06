const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const createCategoryEmbed = require("../../Utilities/createCategoryEmbed.js");
const buildDeckEmbed = require("../../Utilities/buildDeckEmbed.js");
const collectDecksWithCard = require("../../Utilities/collectDecksWithCard.js");
const categorizeDecks = require("../../Utilities/categorizeDecks.js");
const createCategorySelectMenu = require("../../Utilities/createCategorySelectMenu.js");
const calculateNavIndices = require("../../Utilities/calculateNavIndices.js");
const buildNavigationRow = require("../../Utilities/buildNavigationRow.js");

async function startDetectDecksByName(interaction, db, cardName) {
  console.log("Detecting decks for card:", cardName);
  await interaction.deferReply();

  const allDecks = await collectDecksWithCard(db, cardName);

  if (allDecks.length === 0) {
    await interaction.deleteReply();
    await interaction.followUp({
      content: `No decks found containing "${cardName}".`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { availableCategories, deckLists } = categorizeDecks(allDecks);
  const select = createCategorySelectMenu(cardName, availableCategories, deckLists);

  const initialEmbed = new EmbedBuilder()
    .setTitle(`Decks containing "${cardName}"`)
    .setColor("Blue")
    .setDescription([
      `Found **${allDecks.length}** deck(s) containing **"${cardName}"**`,
      "",
      "Select a category below to browse the decks with navigation."
    ].join("\n"))
    .setFooter({ text: "Use the select menu to filter by category" });

  const message = await interaction.editReply({
    embeds: [initialEmbed],
    components: [new ActionRowBuilder().addComponents(select)]
  });

  // Store data for navigation
  if (!interaction.client.detectDecksData) {
    interaction.client.detectDecksData = new Map();
  }
  interaction.client.detectDecksData.set(message.id, {
    cardName,
    deckLists,
    availableCategories
  });

  console.log(`Stored detectdecks data for message ID: ${message.id}`);
  setupDetectDecksCollector(message, cardName, interaction.client);
}

async function handleDetectDecks(interaction, db) {
  const cardName = interaction.customId.replace("detectdecks_", "");

  // Only handle initial button click
  if (!interaction.customId.match(/^detectdecks_[^_]+$/)) return;

  await startDetectDecksByName(interaction, db, cardName);
}

function setupDetectDecksCollector(message, cardName, client) {
  const filter = (i) => (
    i.customId.startsWith(`deckcat_${cardName}`) ||
    i.customId.startsWith("decknav_") ||
    i.customId.startsWith("deckback_")
  );

  const collector = message.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      await handleDetectDecksNavigation(i, message.id, client);
    } catch (error) {
      console.error("Error in detectdecks collector:", error);
    }
  });
}

async function handleDetectDecksNavigation(interaction, messageId, client) {
  const data = client.detectDecksData.get(messageId);
  if (!data) {
    await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("deckcat_")) {
    await handleCategorySelect(interaction, data, client);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("decknav_")) {
    await handleDeckNavigation(interaction, data);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("deckback_")) {
    await handleBackToList(interaction, data);
  }
}

async function handleCategorySelect(interaction, data, client) {
  const category = interaction.values[0];
  const list = data.deckLists[category] || [];

  if (list.length === 0) {
    return await interaction.reply({
      content: "No decks in that category.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (list.length === 1) {
    const embed = buildDeckEmbed(list[0], "Random");
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  const categoryEmbed = createCategoryEmbed(
    data.cardName,
    "Blue",
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`),
    list.length,
    null
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  const replyMessage = await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral,
    fetchReply: true,
  });

  if (!client.detectDecksData) {
    client.detectDecksData = new Map();
  }
  client.detectDecksData.set(replyMessage.id, data);
  setupDetectDecksCollector(replyMessage, data.cardName, client);
  return;
}

async function handleDeckNavigation(interaction, data) {
  const [, category, indexStr] = interaction.customId.split("_");
  const index = Number.parseInt(indexStr, 10);
  const list = data.deckLists[category] || [];

  if (!list[index]) {
    return await interaction.reply({
      content: "Deck not found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = buildDeckEmbed(list[index], "Random");

  const { prevIndex, nextIndex } = calculateNavIndices(index, list.length);
  const navRow = buildNavigationRow(category, prevIndex, nextIndex, "decknav", "deckback");

  return await interaction.update({
    embeds: [embed],
    components: [navRow]
  });
}

async function handleBackToList(interaction, data) {
  const category = interaction.customId.replace("deckback_", "");
  const list = data.deckLists[category] || [];

  const categoryEmbed = createCategoryEmbed(
    data.cardName,
    "Blue",
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`),
    list.length,
    null
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`decknav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  return await interaction.update({
    embeds: [categoryEmbed],
    components: [navRow]
  });
}

module.exports = { handleDetectDecks, startDetectDecksByName };
