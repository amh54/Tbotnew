const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const createCategoryEmbed = require("../features/decks/createCategoryEmbed.js");
const buildDeckEmbed = require("../features/decks/buildDeckEmbed.js");
const categorizeHeroDecks = require("../features/heroes/categorizeHeroDecks.js");
const createHeroSelectMenu = require("../features/heroes/createHeroSelectMenu.js");
const calculateNavIndices = require("../features/decks/calculateNavIndices.js");
const buildNavigationRow = require("../features/decks/buildNavigationRow.js");
const { commandToHeroMap, heroTableMap, heroNameToTable } = require("../features/heroes/getHeroMappings.js");

async function handleHeroHelp(interaction, db, client) {
  const heroCommand = interaction.customId.replace("herohelp_", "");
  
  try {
    const heroName = commandToHeroMap[heroCommand];
    const deckTable = heroTableMap[heroCommand];

    if (!heroName || !deckTable) {
      return await interaction.reply({
        content: "Hero Data not found. Please try reclicking the button or resending command.",
        flags: MessageFlags.Ephemeral
      });
    }

    const [heroRows] = await db.query("SELECT * FROM herocommands WHERE heroname = ?", [heroName]);
    if (!heroRows || heroRows.length === 0) {
      return await interaction.reply({
        content: "Hero Data not found in database.",
        flags: MessageFlags.Ephemeral
      });
    }

    const heroRow = heroRows[0];
    const [decks] = await db.query(`SELECT * FROM ${deckTable} ORDER BY name ASC`);
    
    if (!decks || decks.length === 0) {
      return await interaction.reply({
        content: `No ${heroName} decks found in the database.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const { normalized, deckLists, availableCategories } = categorizeHeroDecks(decks, heroName, deckTable);

    if (normalized.length === 1) {
      const embed = buildDeckEmbed(normalized[0], heroRow.deck_color || "Blue");
      return await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    const select = createHeroSelectMenu(heroName, heroRow, availableCategories, deckLists, normalized.length);
    
    const initialEmbed = new EmbedBuilder()
      .setTitle(`${heroName} Deck Categories`)
      .setColor(heroRow.deck_color || "Blue")
      .setDescription(`Select a category to view ${heroName} decks — ${heroName} has ${normalized.length} total decks.`)
      .setThumbnail(heroRow.thumbnail || null)
      .setFooter({ text: "Use the select menu to choose a category" });

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: [new ActionRowBuilder().addComponents(select)],
      flags: MessageFlags.Ephemeral
    });

    const responseMessage = await response.fetch();

    if (!client.heroDecksData) {
      client.heroDecksData = new Map();
    }
    client.heroDecksData.set(responseMessage.id, {
      heroName,
      heroCommand,
      deckLists,
      availableCategories,
      categoryColor: heroRow.deck_color || "Blue",
      thumbnailUrl: heroRow.thumbnail || null
    });
    console.log(`Stored hero decks data for message ID: ${responseMessage.id}`);

  } catch (error) {
    console.error("Error in hero help interaction:", error);
    await interaction.reply({
      content: "An error occurred while processing your request.",
      flags: MessageFlags.Ephemeral
    });
  }
}

async function startHeroDecksByName(interaction, db, client, heroName) {
  try {
    const deckTable = heroNameToTable[heroName];

    if (!deckTable) {
      return await interaction.reply({
        content: "Hero Data not found. Please check the hero name and try again.",
        flags: MessageFlags.Ephemeral
      });
    }

    const [heroRows] = await db.query("SELECT * FROM herocommands WHERE heroname = ?", [heroName]);
    if (!heroRows || heroRows.length === 0) {
      return await interaction.reply({
        content: "Hero Data not found in database.",
        flags: MessageFlags.Ephemeral
      });
    }

    const heroRow = heroRows[0];
    const [decks] = await db.query(`SELECT * FROM ${deckTable} ORDER BY name ASC`);

    if (!decks || decks.length === 0) {
      return await interaction.reply({
        content: `No ${heroName} decks found in the database.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const { normalized, deckLists, availableCategories } = categorizeHeroDecks(decks, heroName, deckTable);

    if (normalized.length === 1) {
      const embed = buildDeckEmbed(normalized[0], heroRow.deck_color || "Blue");
      return await interaction.reply({
        embeds: [embed]
      });
    }

    const select = createHeroSelectMenu(heroName, heroRow, availableCategories, deckLists, normalized.length);

    const initialEmbed = new EmbedBuilder()
      .setTitle(`${heroName} Deck Categories`)
      .setColor(heroRow.deck_color || "Blue")
      .setDescription(`Select a category to view ${heroName} decks — ${heroName} has ${normalized.length} total decks.`)
      .setThumbnail(heroRow.thumbnail || null)
      .setFooter({ text: "Use the select menu to choose a category" });

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: [new ActionRowBuilder().addComponents(select)]
    });

    const responseMessage = await response.fetch();

    if (!client.heroDecksData) {
      client.heroDecksData = new Map();
    }
    client.heroDecksData.set(responseMessage.id, {
      heroName,
      heroCommand: null,
      deckLists,
      availableCategories,
      categoryColor: heroRow.deck_color || "Blue",
      thumbnailUrl: heroRow.thumbnail || null
    });
    console.log(`Stored hero decks data for message ID: ${responseMessage.id}`);
  } catch (error) {
    console.error("Error in hero decks slash command:", error);
    await interaction.reply({
      content: "An error occurred while processing your request.",
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleHeroDeckCategory(interaction) {
  if (!interaction.client.heroDecksData) {
    interaction.client.heroDecksData = new Map();
  }
  
  const data = interaction.client.heroDecksData.get(interaction.message.id);
  
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
    const embed = buildDeckEmbed(list[0], data.categoryColor);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  const categoryEmbed = createCategoryEmbed(
    data.heroName,
    data.categoryColor,
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => deck.name.replaceAll(/\s+/g, "").toLowerCase()),
    list.length,
    data.thumbnailUrl
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`herodknav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`herodknav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral
  });

  const responseMessage = await interaction.fetchReply();
  interaction.client.heroDecksData.set(responseMessage.id, {
    ...data,
    currentCategory: category,
    currentList: list
  });
}

async function handleHeroDeckNavigation(interaction) {
  const [, category, indexStr] = interaction.customId.split("_");
  const index = Number.parseInt(indexStr, 10);
  
  if (!interaction.client.heroDecksData) {
    interaction.client.heroDecksData = new Map();
  }
  
  const data = interaction.client.heroDecksData.get(interaction.message.id);
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command.",
      flags: MessageFlags.Ephemeral
    });
  }

  const list = data.deckLists[category] || [];
  if (!list[index]) {
    return await interaction.reply({
      content: "Deck not found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = buildDeckEmbed(list[index], data.categoryColor);
  const { prevIndex, nextIndex } = calculateNavIndices(index, list.length);
  const navRow = buildNavigationRow(category, prevIndex, nextIndex, "herodknav", "herodklist");

  return await interaction.update({
    embeds: [embed],
    components: [navRow]
  });
}

async function handleHeroDeckBackToList(interaction) {
  const category = interaction.customId.replace("herodklist_", "");
  
  if (!interaction.client.heroDecksData) {
    interaction.client.heroDecksData = new Map();
  }
  
  const data = interaction.client.heroDecksData.get(interaction.message.id);
  
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command.",
      flags: MessageFlags.Ephemeral
    });
  }

  const list = data.deckLists[category] || [];
  
  const categoryEmbed = createCategoryEmbed(
    data.heroName,
    data.categoryColor,
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => deck.name.replaceAll(/\s+/g, "").toLowerCase()),
    list.length,
    data.thumbnailUrl
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`herodknav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`herodknav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  return await interaction.update({
    embeds: [categoryEmbed],
    components: [navRow]
  });
}

async function handleHeroCategorySelect(interaction) {
  const heroCommand = interaction.customId.replace("herocat_", "");
  const tempKey = `temp_${heroCommand}_${interaction.message.id}`;
  
  if (!interaction.client.heroHelpData) {
    interaction.client.heroHelpData = new Map();
  }
  
  const data = interaction.client.heroHelpData.get(tempKey);
  
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
    const embed = buildDeckEmbed(list[0], data.deckColor);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  const categoryEmbed = createCategoryEmbed(
    data.heroName,
    data.categoryColor,
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => deck.name.replaceAll(/\s+/g, "").toLowerCase()),
    list.length,
    data.thumbnailUrl
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`heronav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`heronav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral
  });

  const responseMessage = await interaction.fetchReply();

  interaction.client.heroHelpData.set(responseMessage.id, {
    ...data,
    currentCategory: category,
    currentList: list
  });

  setupHeroCategoryCollector(responseMessage, interaction.client);
}

function setupHeroCategoryCollector(message, client) {
  const filter = (i) => i.customId.startsWith("heronav_") || i.customId.startsWith("herolist_");
  const collector = message.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      const collectorData = client.heroHelpData.get(i.message.id);
      if (!collectorData) {
        return await i.reply({
          content: "Data not found. Please try reclicking the button or resending command.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (i.isButton() && i.customId.startsWith("heronav_")) {
        await handleHeroNavButton(i, collectorData);
      } else if (i.isButton() && i.customId.startsWith("herolist_")) {
        await handleHeroListButton(i, collectorData);
      }
    } catch (error) {
      console.error("Error in hero help navigation collector:", error);
    }
  });
}

async function handleHeroNavButton(interaction, data) {
  const [, category, indexStr] = interaction.customId.split("_");
  const index = Number.parseInt(indexStr, 10);
  const list = data.deckLists[category] || [];

  if (!list[index]) {
    return await interaction.reply({
      content: "Deck not found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = buildDeckEmbed(list[index], data.deckColor);
  const { prevIndex, nextIndex } = calculateNavIndices(index, list.length);
  const navRow = buildNavigationRow(category, prevIndex, nextIndex, "heronav", "herolist");

  return await interaction.update({
    embeds: [embed],
    components: [navRow]
  });
}

async function handleHeroListButton(interaction, data) {
  const category = interaction.customId.replace("herolist_", "");
  const list = data.deckLists[category] || [];
  
  const categoryEmbed = createCategoryEmbed(
    data.heroName,
    data.categoryColor,
    category.charAt(0).toUpperCase() + category.slice(1),
    list.map(deck => deck.name.replaceAll(/\s+/g, "").toLowerCase()),
    list.length,
    data.thumbnailUrl
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`heronav_${category}_${list.length - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`heronav_${category}_0`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  return await interaction.update({
    embeds: [categoryEmbed],
    components: [navRow]
  });
}

module.exports = {
  handleHeroHelp,
  startHeroDecksByName,
  handleHeroDeckCategory,
  handleHeroDeckNavigation,
  handleHeroDeckBackToList,
  handleHeroCategorySelect
};