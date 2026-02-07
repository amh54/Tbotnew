const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const createCategoryEmbed = require("../features/decks/createCategoryEmbed.js");
const buildDeckEmbed = require("../features/decks/buildDeckEmbed.js");
const calculateNavIndices = require("../features/decks/calculateNavIndices.js");
const buildNavigationRow = require("../features/decks/buildNavigationRow.js");

async function handleDeckBuilderCategory(interaction) {
  const deckbuilderKey = interaction.customId.replace("deckbuildercat_", "");
  const tempKey = `temp_${deckbuilderKey}_${interaction.message.id}`;
  
  if (!interaction.client.deckbuilderData) {
    interaction.client.deckbuilderData = new Map();
  }
  
  const data = interaction.client.deckbuilderData.get(tempKey);
  
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command.",
      flags: MessageFlags.Ephemeral
    });
  }

  const category = interaction.values[0];
  const list = data.deckLists[category] || [];
  
  if (list.length === 0) {
    return await interaction.reply({
      content: "No decks in that category.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (list.length === 1) {
    const embed = buildDeckEmbed(list[0], data.color || "Random");
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  const categoryEmbed = createCategoryEmbed(
    data.deckbuilderName,
    data.color || "Blue",
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`),
    list.length,
    data.thumb
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dbnav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dbnav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  const response = await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral
  });

  const responseMessage = await response.fetch();

  interaction.client.deckbuilderData.set(responseMessage.id, {
    ...data,
    currentCategory: category,
    currentList: list
  });

  setupDeckBuilderCollector(responseMessage, interaction.client);
}

function setupDeckBuilderCollector(message, client) {
  const filter = (i) => i.customId.startsWith("dbnav_") || i.customId.startsWith("dblist_");
  const collector = message.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      const collectorData = client.deckbuilderData.get(i.message.id);
      if (!collectorData) {
        return await i.reply({
          content: "Data not found. Please try reclicking the button or resending command.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (i.isButton() && i.customId.startsWith("dbnav_")) {
        await handleDeckBuilderNavigation(i, collectorData);
      } else if (i.isButton() && i.customId.startsWith("dblist_")) {
        await handleDeckBuilderBackToList(i, collectorData);
      }
    } catch (error) {
      console.error("Error in deckbuilder navigation collector:", error);
    }
  });
}

async function handleDeckBuilderNavigation(interaction, data) {
  const [, category, indexStr] = interaction.customId.split("_");
  const index = Number.parseInt(indexStr, 10);
  const list = data.deckLists[category] || [];

  if (!list[index]) {
    return await interaction.reply({
      content: "Deck not found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = buildDeckEmbed(list[index], data.color || "Random");
  const { prevIndex, nextIndex } = calculateNavIndices(index, list.length);
  const navRow = buildNavigationRow(category, prevIndex, nextIndex, "dbnav", "dblist");

  return await interaction.update({
    embeds: [embed],
    components: [navRow]
  });
}

async function handleDeckBuilderBackToList(interaction, data) {
  const category = interaction.customId.replace("dblist_", "");
  const list = data.deckLists[category] || [];
  
  const categoryEmbed = createCategoryEmbed(
    data.deckbuilderName,
    data.color || "Blue",
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`),
    list.length,
    data.thumb
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dbnav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dbnav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  return await interaction.update({
    embeds: [categoryEmbed],
    components: [navRow]
  });
}

module.exports = { handleDeckBuilderCategory };
