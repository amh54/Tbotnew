const {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const { ascii, hangmanGuesses } = require("../Utilities/hangman");
const createCategoryEmbed = require("../Utilities/createCategoryEmbed.js");
const buildDeckEmbed = require("../Utilities/buildDeckEmbed.js");
const buildNavRow = require("../Utilities/buildNavRow.js");
const buildCardEmbedFromRow = require("../Utilities/buildCardEmbedFromRow.js");
module.exports = {
  name: "interactionCreate",
  async run(interaction) {
    const client = interaction.client;
    const db = require("../index.js")
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.startsWith("hangman-")) {
        await interaction.deferUpdate();
        const game = hangmanGuesses.get(interaction.message.id);

        if (!game || game.guesses === 7) {
          return interaction.followUp({
            content: "Sorry, this game is no longer active.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const type = interaction.customId.split("-").at(-1);
        const guess = interaction.fields
          .getTextInputValue(`hangman-${type}-input-field`)
          .toLowerCase();

        if (guess.length === 1 && !guess.match(/[a-z]/i)) {
          return interaction.followUp({
            content: "You can only guess a letter.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (game.letters.includes(guess)) {
          return interaction.followUp({
            content: "This letter has already been guessed.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (guess.length > 1 && guess === game.word) {
          const embed = new EmbedBuilder()
            .setTitle("Hangman - Game Over")
            .setColor("Green")
            .setDescription(
              `<@${interaction.user.id}> won!\nThe correct word was: \`${game.word}\``
            );

          interaction.message.edit({
            embeds: [embed],
            components: [],
          });

          return interaction.followUp({
            content: "You win!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (guess.length > 1) {
          const { embeds } = interaction.message;

          const fields = embeds[0].fields.map(({ name }) => ({
            name,
            value:
              name === "Guessed Words"
                ? [...game.words, guess].map((v) => `\`${v}\``).join(", ")
                : (() => {
                    const lettersValue = game.letters.length
                      ? game.letters
                          .map((v) => `\`${v}\``)
                          .sort((a, b) => a.localeCompare(b))
                          .join(", ")
                      : "`N/A`";
                    return lettersValue;
                  })(),
          }));

          const embed = EmbedBuilder.from(embeds[0])
            .setDescription(
              `\`\`\`${ascii[game.guesses + 1]}${game.text}\n\`\`\``
            )
            .setFields(fields);

          await interaction.message.edit({ embeds: [embed] });
        }

        if (guess.length === 1) {
          const { embeds } = interaction.message;

          const fields = embeds[0].fields.map(({ name }) => ({
            name,
            value:
              name === "Guessed Letters"
                ? [...game.letters, guess]
                    .map((v) => `\`${v}\``)
                    .sort((a, b) => a.localeCompare(b))
                    .join(", ")
                : (() => {
                    const wordsValue = game.words.length
                      ? game.words.map((v) => `\`${v}\``).join(", ")
                      : "`N/A`";
                    return wordsValue;
                  })(),
          }));

          game.unguessed.delete(guess);

          if (!game.unguessed.size) {
            const embed = new EmbedBuilder()
              .setTitle("Hangman - Game Over")
              .setColor("Green")
              .setDescription(
                `<@${interaction.user.id}> won!\nThe correct word was: \`${game.word}\``
              );

            interaction.message.edit({
              embeds: [embed],
              components: [],
            });

            return interaction.followUp({
              content: "You win!",
              flags: MessageFlags.Ephemeral,
            });
          }

          const art = game.word.includes(guess)
            ? ascii[game.guesses]
            : ascii[game.guesses + 1];
          const text = [...game.word]
            .map((c) => (game.unguessed.has(c) ? "_" : c))
            .join(" ");

          const embed = EmbedBuilder.from(embeds[0])
            .setDescription(`\`\`\`${art}${text}\n\`\`\``)
            .setFields(fields);

          await interaction.message.edit({ embeds: [embed] });
        }

        if (game.guesses === 6) {
          const embed = new EmbedBuilder()
            .setTitle("Hangman - Game Over")
            .setColor("Red")
            .setDescription(
              `Nobody won this game! \n The correct word was: \`${game.word}\``
            );
          return interaction.message.edit({
            embeds: [embed],
            components: [],
          });
        }

        hangmanGuesses.set(interaction.message.id, {
          word: game.word,
          unguessed: game.unguessed,
          guesses:
            guess.length === 1
              ? (() => {
                  const newGuesses = game.word.includes(guess)
                    ? game.guesses
                    : game.guesses + 1;
                  return newGuesses;
                })()
              : game.guesses + 1,

          letters:
            guess.length === 1
              ? [...game.letters, guess].sort((a, b) => a.localeCompare(b))
              : game.letters,
          words: guess.length === 1 ? game.words : [...game.words, guess],
          text:
            guess.length === 1
              ? [...game.word]
                  .map((c) => (game.unguessed.has(c) ? "_" : c))
                  .join(" ")
              : game.text,
        });
      }
  }
  else if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.slashCommands.get(interaction.commandName);
      console.log("Received command:", interaction.commandName, "Loaded:", !!command);
      if (!command) return;

      try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      console.error("Error executing command:", interaction.commandName, error);
		}
	}
    }
  else if (interaction.type === InteractionType.MessageComponent) {
    if (interaction.customId.startsWith("cardinfo_")) {
  await interaction.deferReply({flags: MessageFlags.Ephemeral});
  
  const tableConfig = [
    { table: "guardiancards" },
    { table: "guardiantricks" },
    { table: "kabloomcards" },
    { table: "kabloomtricks" },
    { table: "megagrowcards" },
    { table: "megagrowtricks" },
    { table: "smartycards" },
    { table: "smartytricks" },
    { table: "solarcards" },
    { table: "solartricks" },
    { table: "beastlycards" },
    { table: "beastlytricks" },
    { table: "brainycards" },
    { table: "brainytricks" },
    { table: "crazycards" },
    { table: "crazytricks" },
    { table: "heartycards" },
    { table: "heartytricks" },
    { table: "sneakycards" },
    { table: "sneakytricks" }
  ];
  
  const dbTableColors = {
    guardiancards: "#964B00",
    guardiantricks: "#964B00",
    kabloomcards: "Red",
    kabloomtricks: "Red",
    megagrowcards: "Green",
    megagrowtricks: "Green",
    smartycards: "White",
    smartytricks: "White",
    solarcards: "Yellow",
    solartricks: "Yellow",
    beastlycards: "Blue",
    beastlytricks: "Blue",
    brainycards: "Purple",
    brainytricks: "Purple",
    crazycards: "Purple",
    crazytricks: "Purple",
    heartycards: "Orange",
    heartytricks: "Orange",
    sneakycards: "#000000",
    sneakytricks: "#000000"
  };

  const cardKey = interaction.customId.replace("cardinfo_", "");
  console.log("Fetching info for card:", cardKey);

  try {
    // ONLY check regular card tables for card_name matches
    for (const t of tableConfig) {
      try {
        const [rows] = await db.query(
          `SELECT * FROM \`${t.table}\` WHERE card_name = ? LIMIT 1`,
          [cardKey]
        );
        
        const cardRow = rows[0];
        if (cardRow) {
          console.log("Built card embed from table:", t.table);
          const embed = buildCardEmbedFromRow(cardRow, t.table, dbTableColors);
          return await interaction.editReply({ embeds: [embed] });
        }
      } catch (tableError) {
        console.error(`Error querying table ${t.table}:`, tableError);
        continue;
      }
    }

    // If no card found in any table
    console.log("No card found for:", cardKey);
    await interaction.editReply({ 
      content: `No card found with the name "${cardKey}".` 
    });

  } catch (error) {
    console.error("Error in cardinfo handler:", error);
    await interaction.editReply({ 
      content: "An error occurred while fetching card information." 
    });
  }
}
  else if (interaction.customId.startsWith("detectdecks_")) {
    // Handle ONLY the initial detectdecks_ button click (not select menu or nav buttons)
    if (interaction.customId.match(/^detectdecks_[^_]+$/)) { // Only matches detectdecks_cardname format
      const cardName = interaction.customId.replace("detectdecks_", "");
      console.log("Detecting decks for card:", cardName);
      
      await interaction.deferReply({flags: MessageFlags.Ephemeral});

      const dbTables = [
        { table: "gsdecks", hero: "Green Shadow" },
        { table: "sfdecks", hero: "Solar Flare" }, 
        { table: "wkdecks", hero: "Wall Knight" },
        { table: "czdecks", hero: "Chompzilla" }, 
        { table: "spdecks", hero: "Spudow" },
        { table: "ctdecks", hero: "Citron" },
        { table: "gkdecks", hero: "Grass Knuckles" },
        { table: "ncdecks", hero: "Night Cap" },
        { table: "rodecks", hero: "Rose" },
        { table: "ccdecks", hero: "Captain Combustible" },
        { table: "bcdecks", hero: "Beta Carrotina" },
        { table: "sbdecks", hero: "Super Brainz" }, 
        { table: "smdecks", hero: "The Smash" },
        { table: "ifdecks", hero: "Impfinity" }, 
        { table: "rbdecks", hero: "Rustbolt" },
        { table: "ebdecks", hero: "Electric Boogaloo" }, 
        { table: "bfdecks", hero: "Brain Freeze" }, 
        { table: "pbdecks", hero: "Professor Brainstorm" }, 
        { table: "imdecks", hero: "Immorticia" }, 
        { table: "zmdecks", hero: "Z-Mech" }, 
        { table: "ntdecks", hero: "Neptuna" },
        { table: "hgdecks", hero: "Huge-Gigantacus" }
      ];

      // Collect all matching decks
      let allDecks = [];
      for (const { table, hero } of dbTables) {
        try {
          const [rows] = await db.query(
            `SELECT * FROM ${table} WHERE cards LIKE ?`,
            [`%${cardName}%`]
          );
           for (const row of rows) {
      // Parse the cards column (newline-separated)
      const cardsList = (row.cards || "")
        .split('\n')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0); // Remove empty lines
      
      // Check for exact match (case-insensitive)
      const searchName = cardName.toLowerCase().trim();
      const hasExactMatch = cardsList.includes(searchName);
      
      if (!hasExactMatch) {
        continue; 
      }
            const rawType = (row.type || "").toString();
            const rawArch = (row.archetype || "").toString();
            const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
            
            allDecks.push({
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
              hero: hero,
              table: table,
              raw: row,
            });
          }
        } catch (error) {
          console.error(`Error querying ${table}:`, error);
        }
      }
      allDecks.sort((a, b) => a.name.localeCompare(b.name));
      if (allDecks.length === 0) {
        return interaction.editReply({
          content: `No decks found containing "${cardName}".`,
        });
      }

      // Group decks by categories dynamically based on what's available
      const availableCategories = ["all"];
      const deckLists = { all: allDecks };

      // Add categories that actually exist in the results
      const categoryChecks = [
        { key: "budget", check: (deck) => deck.typeNorm.includes("budget") },
        { key: "competitive", check: (deck) => deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp") },
        { key: "ladder", check: (deck) => deck.typeNorm.includes("ladder") },
        { key: "meme", check: (deck) => deck.typeNorm.includes("meme") },
        { key: "aggro", check: (deck) => deck.archetypeNorm.includes("aggro") },
        { key: "combo", check: (deck) => deck.archetypeNorm.includes("combo") },
        { key: "control", check: (deck) => deck.archetypeNorm.includes("control") },
        { key: "midrange", check: (deck) => deck.archetypeNorm.includes("midrange") },
        { key: "tempo", check: (deck) => deck.archetypeNorm.includes("tempo") }
      ];

      for (const { key, check } of categoryChecks) {
        const filtered = allDecks.filter(check);
        if (filtered.length > 0) {
          availableCategories.push(key);
          deckLists[key] = filtered;
        }
      }

      // Create select menu options only for available categories
      const selectOptions = [];

      // Add category options that have decks
      const categoryLabels = {
        budget: { label: "Budget Decks", emoji: "💰", desc: "Decks that are cheap for new players" },
        competitive: { label: "Competitive Decks", emoji: "🏆", desc: "Some of the best decks in the game" }, // Changed from 'comp'
        ladder: { label: "Ladder Decks", emoji: "🪜", desc: "Decks that are mostly only good for ranked games" },
        meme: { label: "Meme Decks",  emoji: "😂", desc: "Decks built for fun/weird combos" },
        aggro: { label: "Aggro Decks", emoji: "⚡", desc: "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7." },
        combo: { label: "Combo Decks",  emoji: "🧩", desc: "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)." },
        control: { label: "Control Decks",  emoji: "🛡️", desc: 'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.' },
        midrange: { label: "Midrange Decks",  emoji: "⚖️", desc: "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game" },
        tempo: { label: "Tempo Decks",  emoji: "🏃‍♂️", desc: "Focuses on slowly building a big board, winning trades and overwhelming the opponent." }
      };

      for (const cat of availableCategories.slice(1)) { // Skip "all" since we already added it
        const config = categoryLabels[cat];
        if (config && deckLists[cat].length > 0) {
          selectOptions.push(
            new StringSelectMenuOptionBuilder()
              .setLabel(`${config.label} (${deckLists[cat].length})`)
              .setValue(cat)
              .setDescription(config.desc)
              .setEmoji(config.emoji)
          );
        }
      }
           // Always add "All" option
      selectOptions.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`All Decks (${allDecks.length})`)
          .setValue("all")
          .setEmoji("📋")
          .setDescription(`View all decks containing "${cardName}"`)
      );
      const select = new StringSelectMenuBuilder()
        .setCustomId(`deckcat_${cardName}`)
        .setPlaceholder(`Select a category to view decks containing "${cardName}"`)
        .addOptions(selectOptions);

      const initialEmbed = new EmbedBuilder()
        .setTitle(`Decks containing "${cardName}"`)
        .setColor("Blue")
        .setDescription([
          `Found **${allDecks.length}** deck(s) containing **"${cardName}"**`,
          "",
          "Select a category below to browse the decks with navigation."
        ].join("\n"))
        .setFooter({ text: "Use the select menu to filter by category" });
      // After collecting all decks, but before storing in detectDecksData
for (const [key, deckList] of Object.entries(deckLists)) {
  deckLists[key] = deckList.toSorted((a, b) => 
  a.hero.localeCompare(b.hero, undefined, { sensitivity: "base" }) ||
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
);
}
      // Use message ID instead of interaction ID for better persistence
      const message = await interaction.editReply({
        embeds: [initialEmbed],
        components: [new ActionRowBuilder().addComponents(select)]
      });


// Store the deck data using message ID
if (!interaction.client.detectDecksData) {
  interaction.client.detectDecksData = new Map();
}
interaction.client.detectDecksData.set(message.id, {
  cardName,
  deckLists, 
  availableCategories
});

      console.log(`Stored detectdecks data for message ID: ${message.id}`);

      // Set up collector for the select menu and navigation
      const filter = (i) => (
        i.customId.startsWith(`deckcat_${cardName}`) ||
        i.customId.startsWith("decknav_") ||
        i.customId.startsWith("deckback_")
      );
      
      const collector = message.createMessageComponentCollector({ 
        filter
      });

      collector.on("collect", async (i) => {
        try {
          const data = interaction.client.detectDecksData.get(message.id);
          if (!data) {
            return await i.reply({ 
              content: "Data not found. Please try reclicking the button or resending command. Please try running the command again.", 
              flags: MessageFlags.Ephemeral 
            });
          }

          if (i.isStringSelectMenu() && i.customId.startsWith("deckcat_")) {
            const category = i.values[0];
            const list = data.deckLists[category] || [];
             
            if (list.length === 0) {
              return await i.reply({
                content: "No decks in that category.",
                flags: MessageFlags.Ephemeral,
              });
            }

            // If only one deck, show it directly
            if (list.length === 1) {
              const embed = buildDeckEmbed(list[0], "Random");
              return await i.reply({ 
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
              });
            }
            // Show category overview with navigation buttons
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

            return await i.update({ 
              embeds: [categoryEmbed], 
              components: [navRow] 
            });
          }

          if (i.isButton() && i.customId.startsWith("decknav_")) {
            const [, category, indexStr] = i.customId.split("_");
            const index = Number.parseInt(indexStr, 10);
            const list = data.deckLists[category] || [];

            if (!list[index]) {
              return await i.reply({
                content: "Deck not found.",
                flags: MessageFlags.Ephemeral,
              });
            }

            const embed = buildDeckEmbed(list[index], "Random");
            
            // Handle navigation with "Back to List" at extremes
            let prevIndex, nextIndex;
            
            if (index === 0) {
              prevIndex = 'list';
              nextIndex = list.length > 1 ? 1 : 'list';
            } else if (index === list.length - 1) {
              prevIndex = index - 1;
              nextIndex = 'list';
            } else {
              prevIndex = index - 1;
              nextIndex = index + 1;
            }

            const navRow = new ActionRowBuilder();

            // Left button
            if (prevIndex === 'list') {
              navRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`deckback_${category}`)
                  .setEmoji("📋")
                  .setLabel("Back to List")
                  .setStyle(ButtonStyle.Secondary)
              );
            } else {
              navRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`decknav_${category}_${prevIndex}`)
                  .setEmoji("⬅️")
                  .setStyle(ButtonStyle.Primary)
              );
            }

            // Right button
            if (nextIndex === 'list') {
              navRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`deckback_${category}`)
                  .setEmoji("📋")
                  .setLabel("Back to List")
                  .setStyle(ButtonStyle.Secondary)
              );
            } else {
              navRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`decknav_${category}_${nextIndex}`)
                  .setEmoji("➡️")
                  .setStyle(ButtonStyle.Primary)
              );
            }

            return await i.update({ 
              embeds: [embed], 
              components: [navRow] 
            });
          }

          if (i.isButton() && i.customId.startsWith("deckback_")) {
            const category = i.customId.replace("deckback_", "");
            const list = data.deckLists[category] || [];
            
            const categoryEmbed = createCategoryEmbed(
               data.cardName,
              "Blue",
              category.charAt(0).toUpperCase() + category.slice(1), 
              list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`), // Use sortedList
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

            return await i.update({ 
              embeds: [categoryEmbed], 
              components: [navRow] 
            });
          }

        } catch (error) {
          console.error("Error in detectdecks collector:", error);
        }
      });
    }
  }
  else if (interaction.customId.startsWith("deckbuildercat_")) {
  // Extract deckbuilder name from customId
  const deckbuilderKey = interaction.customId.replace("deckbuildercat_", "");
  const tempKey = `temp_${deckbuilderKey}_${interaction.message.id}`;
  
  // Initialize the Map if it doesn't exist
if (!interaction.client.deckbuilderData) {
  interaction.client.deckbuilderData = new Map();
}
  const data = interaction.client.deckbuilderData.get(tempKey);
  
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command. Please try running the command again.",
      flags: MessageFlags.Ephemeral
    });
  }

  const category = interaction.values[0];
  const list = data.deckLists[category] || [];
  
  // If no decks in category, early reply
  if (list.length === 0) {
    return await interaction.reply({
      content: "No decks in that category.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // If only one deck, show it directly
  if (list.length === 1) {
    const embed = buildDeckEmbed(list[0], data.color || "Random");
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Show category overview with navigation buttons
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
      .setCustomId(`dbnav_${category}_${list.length - 1}`) // Start from last deck
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dbnav_${category}_0`) // Go to first deck
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Primary)
  );

  const response = await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral
  });

  // Get the response message object
  const responseMessage = await response.fetch();

  // Store the data with the RESPONSE message ID (for navigation)
  interaction.client.deckbuilderData.set(responseMessage.id, {
    ...data,
    currentCategory: category,
    currentList: list
  });

  
  // Set up collector for navigation on the RESPONSE message
  const filter = (i) => i.customId.startsWith("dbnav_") || i.customId.startsWith("dblist_");
  const collector = responseMessage.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      const collectorData = interaction.client.deckbuilderData.get(i.message.id);
      if (!collectorData) {
        return await i.reply({
          content: "Data not found. Please try reclicking the button or resending command.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (i.isButton() && i.customId.startsWith("dbnav_")) {
        const [, category, indexStr] = i.customId.split("_");
        const index = Number.parseInt(indexStr, 10);
        const list = collectorData.deckLists[category] || [];

        if (!list[index]) {
          return await i.reply({
            content: "Deck not found.",
            flags: MessageFlags.Ephemeral,
          });
        }

        // ALWAYS show the deck first
        const embed = buildDeckEmbed(list[index], collectorData.color || "Random");

        // Handle navigation with wrapping - at extremes, wrap to other end or go to list
        let prevIndex, nextIndex;
        
        if (index === 0) {
          // At first deck - left goes to category list, right goes to next deck
          prevIndex = 'list'; // Special marker for going back to list
          nextIndex = list.length > 1 ? 1 : 'list';
        } else if (index === list.length - 1) {
          // At last deck - left goes to previous, right goes to category list  
          prevIndex = index - 1;
          nextIndex = 'list'; // Special marker for going back to list
        } else {
          // Normal navigation
          prevIndex = index - 1;
          nextIndex = index + 1;
        }

        const navRow = new ActionRowBuilder();

        // Left button
        if (prevIndex === 'list') {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dblist_${category}`) // Special ID for going back to list
              .setEmoji("📋")
              .setLabel("Back to List")
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dbnav_${category}_${prevIndex}`)
              .setEmoji("⬅️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        // Right button  
        if (nextIndex === 'list') {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dblist_${category}`) // Special ID for going back to list
              .setEmoji("📋")
              .setLabel("Back to List")
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dbnav_${category}_${nextIndex}`)
              .setEmoji("➡️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        return await i.update({
          embeds: [embed],
          components: [navRow]
        });
      }
    if (i.isButton() && i.customId.startsWith("dblist_")) {
      const category = i.customId.replace("dblist_", "");
      const list = collectorData.deckLists[category] || [];
      
      const categoryEmbed = createCategoryEmbed(
        collectorData.deckbuilderName,
        collectorData.color || "Blue",
        category.charAt(0).toUpperCase() + category.slice(1),
        list.map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`),
        list.length,
        collectorData.thumb
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

      return await i.update({
        embeds: [categoryEmbed],
        components: [navRow]
      });
    }

    } catch (error) {
      console.error("Error in deckbuilder navigation collector:", error);
    }
  });
}
else if (interaction.customId.startsWith("herocat_")) {
  // Extract hero command from customId
  const heroCommand = interaction.customId.replace("herocat_", "");
  const tempKey = `temp_${heroCommand}_${interaction.message.id}`;
  // Initialize the Map if it doesn't exist
  if (!interaction.client.heroHelpData) {
    interaction.client.heroHelpData = new Map();
  }
  
  const data = interaction.client.heroHelpData.get(tempKey);
  
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command. Please try running the command again.",
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

  // If only one deck, show it directly
  if (list.length === 1) {
    const embed = buildDeckEmbed(list[0], data.deckColor);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Show category overview with navigation buttons
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

  const response = await interaction.reply({
    embeds: [categoryEmbed],
    components: [navRow],
    flags: MessageFlags.Ephemeral
  });

  const responseMessage = await response.fetch();

  // Store data with response message ID
  interaction.client.heroHelpData.set(responseMessage.id, {
    ...data,
    currentCategory: category,
    currentList: list
  });

  // Set up collector for navigation
  const filter = (i) => i.customId.startsWith("heronav_") || i.customId.startsWith("herolist_");
  const collector = responseMessage.createMessageComponentCollector({ filter });

  collector.on("collect", async (i) => {
    try {
      const collectorData = interaction.client.heroHelpData.get(i.message.id);
      if (!collectorData) {
        return await i.reply({
          content: "Data not found. Please try reclicking the button or resending command.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (i.isButton() && i.customId.startsWith("heronav_")) {
        const [, category, indexStr] = i.customId.split("_");
        const index = Number.parseInt(indexStr, 10);
        const list = collectorData.deckLists[category] || [];

        if (!list[index]) {
          return await i.reply({
            content: "Deck not found.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const embed = buildDeckEmbed(list[index], collectorData.deckColor);

        // Handle navigation
        let prevIndex, nextIndex;
        
        if (index === 0) {
          prevIndex = 'list';
          nextIndex = list.length > 1 ? 1 : 'list';
        } else if (index === list.length - 1) {
          prevIndex = index - 1;
          nextIndex = 'list';
        } else {
          prevIndex = index - 1;
          nextIndex = index + 1;
        }

        const navRow = new ActionRowBuilder();

        // Left button
        if (prevIndex === 'list') {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`herolist_${category}`)
              .setEmoji("📋")
              .setLabel("Back to List")
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`heronav_${category}_${prevIndex}`)
              .setEmoji("⬅️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        // Right button
        if (nextIndex === 'list') {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`herolist_${category}`)
              .setEmoji("📋")
              .setLabel("Back to List")
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          navRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`heronav_${category}_${nextIndex}`)
              .setEmoji("➡️")
              .setStyle(ButtonStyle.Primary)
          );
        }

        return await i.update({
          embeds: [embed],
          components: [navRow]
        });
      }

      if (i.isButton() && i.customId.startsWith("herolist_")) {
        const category = i.customId.replace("herolist_", "");
        const list = collectorData.deckLists[category] || [];
        
        const categoryEmbed = createCategoryEmbed(
          collectorData.heroName,
          collectorData.categoryColor,
          category.charAt(0).toUpperCase() + category.slice(1),
          list.map(deck => deck.name.replaceAll(/\s+/g, "").toLowerCase()),
          list.length,
          collectorData.thumbnailUrl
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

        return await i.update({
          embeds: [categoryEmbed],
          components: [navRow]
        });
      }

    } catch (error) {
      console.error("Error in hero help navigation collector:", error);
    }
  });
}
else if (interaction.customId.startsWith("herohelp_")) {
  const heroCommand = interaction.customId.replace("herohelp_", ""); 
  
  try {
    // Map the command back to hero name for database lookup
    const commandToHeroMap = {
      "helpbc": "Beta-Carrotina",
      "helpcc": "Captain Combustible",
      "helpct": "Citron",
      "helpcz": "Chompzilla", 
      "helpgk": "Grass Knuckles",
      "helpgs": "Green Shadow",
      "helpnc": "Night Cap",
      "helpro": "Rose",
      "helpsf": "Solar Flare",
      "helpsp": "Spudow",
      "helpwk": "Wall-Knight",
      "helpbf": "Brain Freeze",
      "helpeb": "Electric Boogaloo",
      "helphg": "Huge-Gigantacus",
      "helpsb": "Super Brainz",
      "helpif": "Impfinity",
      "helpim": "Immorticia",
      "helpnt": "Neptuna",
      "helppb": "Professor Brainstorm",
      "helprb": "Rustbolt",
      "helpsm": "The Smash",
      "helpzm": "Z-Mech"
    };

    const heroTableMap = {
      "helpbc": "bcdecks",
      "helpcc": "ccdecks",
      "helpct": "ctdecks",
      "helpcz": "czdecks",
      "helpgk": "gkdecks", 
      "helpgs": "gsdecks",
      "helpnc": "ncdecks",
      "helpro": "rodecks",
      "helpsf": "sfdecks",
      "helpsp": "spdecks",
      "helpwk": "wkdecks",
      "helpbf": "bfdecks",
      "helpeb": "ebdecks",
      "helphg": "hgdecks",
      "helpsb": "sbdecks",
      "helpif": "ifdecks",
      "helpim": "imdecks",
      "helpnt": "ntdecks",
      "helppb": "pbdecks",
      "helprb": "rbdecks",
      "helpsm": "smdecks",
      "helpzm": "zmdecks"
    };

    const heroName = commandToHeroMap[heroCommand];
    const deckTable = heroTableMap[heroCommand];

    if (!heroName || !deckTable) {
      return await interaction.reply({
        content: "Hero Data not found. Please try reclicking the button or resending command.",
        flags: MessageFlags.Ephemeral
      });
    }

    // Query the hero data using heroname
    const [heroRows] = await db.query("SELECT * FROM herocommands WHERE heroname = ?", [heroName]);
    if (!heroRows || heroRows.length === 0) {
      return await interaction.reply({
        content: "Hero Data not found. Please try reclicking the button or resending command in database.",
        flags: MessageFlags.Ephemeral
      });
    }

    const heroRow = heroRows[0];

    // Fetch all decks for this hero
    const [decks] = await db.query(`SELECT * FROM ${deckTable} ORDER BY name ASC`);
    
    if (!decks || decks.length === 0) {
      return await interaction.reply({
        content: `No ${heroName} decks found in the database.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Normalize and categorize decks
    const matchesCategory = require("../Utilities/matchesCategory");
    
    const normalized = decks.map((r) => {
      const rawType = (r.type || "").toString();
      const rawArch = (r.archetype || "").toString();
      const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
      return {
        id: r.deckID ?? null,
        name: r.name ?? r.deckID ?? "Unnamed",
        type: rawType,
        archetype: rawArch,
        cost: r.cost ?? r.deckcost ?? "",
        image: r.image ?? null,
        creator: r.creator ?? "",
        typeNorm: normalize(rawType),
        archetypeNorm: normalize(rawArch),
        description: r.description ?? "",
        raw: r,
        hero: heroName,
        table: deckTable
      };
    });

    // Sort decks alphabetically
    normalized.sort((a, b) => a.name.localeCompare(b.name));

    const allCategories = ["budget", "competitive", "ladder", "meme", "aggro", "combo", "control", "midrange", "tempo"];
    const availableCategories = ["all"];
    const deckLists = { all: normalized };

    for (const cat of allCategories) {
      const filtered = normalized.filter((r) => matchesCategory(r, cat));
      if (filtered.length > 0) {
        availableCategories.push(cat);
        deckLists[cat] = filtered;
      }
    }

    // If only one deck total, show it directly
    if (normalized.length === 1) {
      const embed = buildDeckEmbed(normalized[0], heroRow.deck_color || "Blue");
      return await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    // Create select menu options
    const selectOptions = [];

    const categoryLabels = {
      budget: { label: "Budget Decks", emoji: "💰", desc: "Decks that are cheap for new players" },
      competitive: { label: "Competitive Decks", emoji: "🏆", desc: "Some of the best decks in the game" }, // Changed from 'comp'
      ladder: { label: "Ladder Decks", emoji: "🪜", desc: "Decks that are mostly only good for ranked games" },
      meme: { label: "Meme Decks",  emoji: "😂", desc: "Decks built for fun/weird combos" },
      aggro: { label: "Aggro Decks", emoji: "⚡", desc: "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7." },
      combo: { label: "Combo Decks",  emoji: "🧩", desc: "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)." },
      control: { label: "Control Decks",  emoji: "🛡️", desc: 'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.' },
      midrange: { label: "Midrange Decks",  emoji: "⚖️", desc: "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game" },
      tempo: { label: "Tempo Decks",  emoji: "🏃‍♂️", desc: "Focuses on slowly building a big board, winning trades and overwhelming the opponent." }
    };

    // Add available categories to select menu (skip "all" for now)
    for (const cat of availableCategories.slice(1)) {
      const config = categoryLabels[cat];
      if (config) {
        selectOptions.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${config.label} (${deckLists[cat].length})`)
            .setValue(cat)
            .setDescription(config.desc)
            .setEmoji(config.emoji)
        );
      }
    }

    // Add "All Decks" option at the end
    selectOptions.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`All ${heroName} Decks (${normalized.length})`)
        .setValue("all")
        .setDescription(`View all ${heroName} decks`)
        .setEmoji(heroRow.hero_emoji || "🎮")
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId(`herodeck_${heroName.toLowerCase().replaceAll(/[^a-z]/g, '')}`)
      .setPlaceholder(`Select a category to view ${heroName} decks`)
      .addOptions(selectOptions);

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

    // Store data for interaction handling
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
      content: "An error occurred while loading hero data.",
      flags: MessageFlags.Ephemeral
    });
  }
}

else if (interaction.customId.startsWith("herodeck_")) {
  // Initialize the Map if it doesn't exist
  if (!interaction.client.heroDecksData) {
    interaction.client.heroDecksData = new Map();
  }
  
  const data = interaction.client.heroDecksData.get(interaction.message.id);
  
  if (!data) {
    return await interaction.reply({
      content: "Data not found. Please try reclicking the button or resending command. Please try running the command again.",
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

  // If only one deck in category, show it directly
  if (list.length === 1) {
    const embed = buildDeckEmbed(list[0], data.categoryColor);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Show category overview with navigation buttons
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

  // Update the interaction to show the category list
  await interaction.update({
    embeds: [categoryEmbed],
    components: [navRow]
  });

  // Store updated data with current category
  data.currentCategory = category;
  data.currentList = list;
  interaction.client.heroDecksData.set(interaction.message.id, data);
}
else if (interaction.customId.startsWith("herodknav_")) {
  const [, category, indexStr] = interaction.customId.split("_");
  const index = Number.parseInt(indexStr, 10);
  
  // Initialize the Map if it doesn't exist
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

  // Handle navigation with wrapping
  let prevIndex, nextIndex;
  
  if (index === 0) {
    prevIndex = 'list';
    nextIndex = list.length > 1 ? 1 : 'list';
  } else if (index === list.length - 1) {
    prevIndex = index - 1;
    nextIndex = 'list';
  } else {
    prevIndex = index - 1;
    nextIndex = index + 1;
  }

  const navRow = new ActionRowBuilder();

  // Left button
  if (prevIndex === 'list') {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`herodklist_${category}`)
        .setEmoji("📋")
        .setLabel("Back to List")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`herodknav_${category}_${prevIndex}`)
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary)
    );
  }

  // Right button
  if (nextIndex === 'list') {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`herodklist_${category}`)
        .setEmoji("📋")
        .setLabel("Back to List")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`herodknav_${category}_${nextIndex}`)
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return await interaction.update({
    embeds: [embed],
    components: [navRow]
  });
}

// Add back to list handler
else if (interaction.customId.startsWith("herodklist_")) {
  const category = interaction.customId.replace("herodklist_", "");
  
  // Initialize the Map if it doesn't exist
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
    else if (interaction.customId.startsWith("hangman-")) {
      const type = interaction.customId.split("-").at(-1);

      const modal = new ModalBuilder()
        .setTitle(`Guess a ${type}`)
        .setCustomId(`hangman-guess-modal-${type}`);

      const modalInput = new TextInputBuilder()
        .setCustomId(`hangman-${type}-input-field`)
        .setLabel(`What ${type} would you like to guess?`)
        .setMinLength(type === "letter" ? 1 : 2)
        .setMaxLength(type === "letter" ? 1 : 25)
        .setStyle(TextInputStyle.Short);

      const row = new ActionRowBuilder({
        components: [modalInput],
      });

      modal.addComponents(row);

      await interaction.showModal(modal);
    }
  }
    else if(interaction.type === InteractionType.ApplicationCommandAutocomplete){
     const command = interaction.client.slashCommands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
    }
  },
};