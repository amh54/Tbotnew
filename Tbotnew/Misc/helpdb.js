const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require("discord.js");
const db = require("../index.js")
const  createCategoryEmbed  = require("../Utilities/createCategoryEmbed");
const  buildDeckEmbed  = require("../Utilities/buildDeckEmbed");
const buildNavRow  = require("../Utilities/buildNavRow");
module.exports = {
  name: `helpdb`,
  aliases: [
    `dbhelp`,
    `dbcommands`,
    `dbdecks`,
    `ladderdeck`,
    `decksdb`,
    `database`,
    `db`,
    `databasedecks`,
    `databasehelp`,
    `helpdatabase`,
    `alldecks`,
    `competitive`,
    `comp`,
    `decks`,
    `decklists`,
    `deck`,
    `competitivedecks`,
    `ladder`,
    `ladderdecks`,
    `aggro`,
    `aggrodecks`,
    `memeplantdecks`,
    `helpladder`,
    `allzombiedecks`,
    `allplantsdecks`,
    `meme`,
    `control`,
    `controldecks`,
    `combo`,
    `combodecks`,
    `midrange`,
    `midrangedecks`,
    `meme`,
    `memedecks`,
    `memedeck`,
    `memedb`,
    `tbotdb`,
    `helpaggro`,
    `competitivedecklists`,
    `competitiveplantdecks`,
    `budget`,
    `budgetdecks`,
    `helpmeme`,
    `ladderplantdecks`,
    `competitivezombiedecks`,
    `competitiveplants`,
    `all`,
    `budgethelp`,
    `plantdecks`,
    `zombiedecks`,
    `decklist`,
    `decklists`,
    `tempo`,
    `tempodecks`,
    `decktype`,
    `decktypes`,
    `archetype`,
    `archetypes`,
    `budgetdb`,
    `deckdb`,
    `plantdeck`,
    `zombiedeck`,
    `plants`,
    `zombies`,
  ],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    try {
      // Move all your existing logic here instead of top-level

      // Helper to get hero name from table name
      function getHeroFromTable(table) {
        const heroMap = {
          // Plant heroes
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
          // Zombie heroes
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
        return heroMap[table] || "Unknown";
      }

      // Fetch decks from table function
      async function fetchDecksFromTable(table, type) {
        try {
          const result = await db.query(
            `SELECT * FROM ${table} ORDER BY name COLLATE utf8mb4_general_ci ASC`
          );
          const rows = Array.isArray(result) ? result[0] : [];
          return (rows || []).map((r) => {
            const rawType = (r.type || "").toString();
            const rawArch = (r.archetype || "").toString();
            const normalize = (s) => s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
            return {
              id: r.deckID ?? null,
              name: r.name ?? r.deckID ?? "Unnamed",
              type: rawType,
              archetype: rawArch,
              cost: r.cost ?? r.deckcost ?? "",
              typeNorm: normalize(rawType),
              archetypeNorm: normalize(rawArch),
              description: r.description ?? "",
              image: r.image ?? null,
              creator: r.creator ?? "",
              raw: r,
              deckType: type,
              hero: getHeroFromTable(table),
              table: table,
            };
          });
        } catch (err) {
          console.error(`Error querying table ${table}:`, err);
          return [];
        }
      }

      // Plant tables
      const plantTables = [
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

      // Zombie tables
      const zombieTables = [
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

      // Fetch all decks
      const plantPromises = plantTables.map((table) =>
        fetchDecksFromTable(table, "plant")
      );
      const zombiePromises = zombieTables.map((table) =>
        fetchDecksFromTable(table, "zombie")
      );

      const plantResults = await Promise.all(plantPromises);
      const zombieResults = await Promise.all(zombiePromises);

      const plantDecks = plantResults.flat();
      const zombieDecks = zombieResults.flat();

      // Category matching function
      function matchesCategory(deck, category) {
        if (category === "all") return true;
        if (category === "comp")
          return (
            deck.typeNorm.includes("competitive") || deck.typeNorm.includes("comp")
          );
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

      // Categories to check
      const categories = [
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

      // Build deck lists for each category and type with hero-based sorting
      const deckLists = {};
      for (const cat of categories) {
        deckLists[`plant_${cat}`] = plantDecks
          .filter((r) => matchesCategory(r, cat))
          .sort((a, b) => {
            const heroCompare = a.hero.localeCompare(b.hero);
            if (heroCompare !== 0) return heroCompare;
            return a.name.localeCompare(b.name);
          });

        deckLists[`zombie_${cat}`] = zombieDecks
          .filter((r) => matchesCategory(r, cat))
          .sort((a, b) => {
            const heroCompare = a.hero.localeCompare(b.hero);
            if (heroCompare !== 0) return heroCompare;
            return a.name.localeCompare(b.name);
          });
      }
// --- 3. Build category embeds ---
const plantThumb =
  "https://media.discordapp.net/attachments/1044626284346605588/1358437770829369404/image.png";
const zombieThumb =
  "https://media.discordapp.net/attachments/1044626284346605588/1358438184182092073/zombieicon.png";

const categoryEmbeds = {};
for (const cat of categories) {
  const plantDeckNames = deckLists[`plant_${cat}`].map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`);
  const zombieDeckNames = deckLists[`zombie_${cat}`].map(deck => `${deck.name.replaceAll(/\s+/g, "").toLowerCase()} (${deck.hero})`);
  
  categoryEmbeds[`plant_${cat}`] = createCategoryEmbed(
    "Plant",
    "#00FF00",
    cat === "comp" ? "Competitive" : cat.charAt(0).toUpperCase() + cat.slice(1),
    plantDeckNames, 
    deckLists[`plant_${cat}`].length,
    plantThumb
  );
  
  categoryEmbeds[`zombie_${cat}`] = createCategoryEmbed(
    "Zombie", 
    "#8B008B", 
    cat === "comp" ? "Competitive" : cat.charAt(0).toUpperCase() + cat.slice(1),
    zombieDeckNames, 
    deckLists[`zombie_${cat}`].length,
    zombieThumb
  );
}

// --- 4. Select menu with category counts ---
const select = new StringSelectMenuBuilder()
  .setCustomId("starter")
  .setPlaceholder(
    "Select an option below to view certain Decktypes or archtypes!"
  )
  .addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(`Budget Plant Decks (${deckLists.plant_budget.length})`)
      .setDescription("Plant Decks that are cheap for new players")
      .setEmoji("💰")
      .setValue("budgetpdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Competitive Plant Decks (${deckLists.plant_comp.length})`)
      .setDescription("Some of the Best Plant Decks in the game")
      .setEmoji("<:compemote:1325461143136764060>")
      .setValue("comppdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Ladder Plant Decks (${deckLists.plant_ladder.length})`)
      .setDescription("Decks that mostly only good for ranked games")
      .setEmoji("<:ladder:1271503994857979964>")
      .setValue("ladderpdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Meme Plant Decks (${deckLists.plant_meme.length})`)
      .setDescription("Plant Decks that are built off a weird/fun combo")
      .setEmoji("🤪")
      .setValue("memepdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Budget Zombie Decks (${deckLists.zombie_budget.length})`)
      .setDescription("Zombie Decks that are cheap for new players")
      .setEmoji("💰")
      .setValue("budgetzdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Competitive Zombie Decks (${deckLists.zombie_comp.length})`)
      .setDescription("Some of the Best Zombie Decks in the game")
      .setEmoji("<:compemote:1325461143136764060>")
      .setValue("compzdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Ladder Zombie Decks (${deckLists.zombie_ladder.length})`)
      .setDescription("Zombie Decks that mostly only good for ranked games")
      .setEmoji("<:ladder:1271503994857979964>")
      .setValue("ladderzdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Meme Zombie Decks (${deckLists.zombie_meme.length})`)
      .setDescription("Zombie Decks that are built off a weird/fun combo")
      .setEmoji("🤪")
      .setValue("memezdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Aggro Plant Decks (${deckLists.plant_aggro.length})`)
      .setDescription(
        "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7."
      )
      .setEmoji("⚡")
      .setValue("aggropdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Combo Plant Decks (${deckLists.plant_combo.length})`)
      .setDescription(
        "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)."
      )
      .setEmoji("🧩")
      .setValue("combopdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Control Plant Decks (${deckLists.plant_control.length})`)
      .setDescription(
        'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.'
      )
      .setEmoji("🛡️")
      .setValue("controlpdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Midrange Plants Decks (${deckLists.plant_midrange.length})`)
      .setDescription(
        "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game"
      )
      .setEmoji("⚖️")
      .setValue("midrangepdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Tempo Plant Decks (${deckLists.plant_tempo.length})`)
      .setDescription(
        "Focuses on slowly building a big board, winning trades and overwhelming the opponent."
      )
      .setEmoji("🏃‍♂️")
      .setValue("tempopdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Aggro Zombie Decks (${deckLists.zombie_aggro.length})`)
      .setDescription(
        "Attempts to kill the opponent as soon as possible, usually winning the game by turn 4-7."
      )
      .setEmoji("⚡")
      .setValue("aggrozdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Combo Zombie Decks (${deckLists.zombie_combo.length})`)
      .setDescription(
        "Uses a specific card synergy to do massive damage to the opponent(OTK or One Turn Kill decks)."
      )
      .setEmoji("🧩")
      .setValue("combozdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Control Zombie Decks (${deckLists.zombie_control.length})`)
      .setDescription(
        'Tries to remove/stall anything the opponent plays and win in the "lategame" with expensive cards.'
      )
      .setEmoji("🛡️")
      .setValue("controlzdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Midrange Zombie Decks (${deckLists.zombie_midrange.length})`)
      .setDescription(
        "Slower than aggro, usually likes to set up earlygame boards into mid-cost cards to win the game"
      )
      .setEmoji("⚖️")
      .setValue("midrangezdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`Tempo Zombie Decks (${deckLists.zombie_tempo.length})`)
      .setDescription(
        "Focuses on slowly building a big board, winning trades and overwhelming the opponent."
      )
      .setEmoji("🏃‍♂️")
      .setValue("tempozdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`All Plant Decks (${deckLists.plant_all.length})`)
      .setDescription("An option to view all Plant Decks")
      .setEmoji("<:allplants:1325472845907623976>")
      .setValue("allpdecks"),
    new StringSelectMenuOptionBuilder()
      .setLabel(`All Zombie Decks (${deckLists.zombie_all.length})`)
      .setDescription("An otion to view all Zombie Decks")
      .setEmoji("<:allzombies:1325472034687418481>")
      .setValue("allzdecks")
  );
const totalDecks = plantDecks.length + zombieDecks.length;
const embed = new EmbedBuilder()
  .setTitle("Tbot Database")
  .setDescription(
    `Please select option from select menus below to access the database
Note: the decks are in alphabetical order by hero and there are ${totalDecks} decks in the databse with ${plantDecks.length} Plant Decks and ${zombieDecks.length} Zombie Decks.`
  )
  .setColor("Random")
  .addFields(
    {
      name: "Budget Decks",
      value:
        "Good for when you don't want to spend money on the game and don't have a lot of sparks or a lot of the rarest cards in the game, but aren't as good as the top decks at the highest level of the game.",
    },
    {
      name: "Competitive Decks",
      value: "Some of the best decks in the game.",
    },
    {
      name: "Ladder Decks",
      value:
        "Useful for Ranked Online Multiplayer, but crumbles into more competitive decks.",
    },
    {
      name: "Meme Decks",
      value:
        "Not designed to be competitive, and never was, even during the deck building process. Was simply made for weird/fun combos and wasn't made with any competitive meta in mind.",
    }
  )
  .setImage(
    "https://media.discordapp.net/attachments/1044626284346605588/1356022131225268255/allheroes.jpg?ex=67eb0d85&is=67e9bc05&hm=6b685aabe10a85ef7c80cf09bced40bf6b671fda726522be203c7d2372203344&=&format=webp&width=1872&height=758"
  )
  .setFooter({ text: "Credit to Iceiboi for deck type explainations" });

const m = await message.channel.send({
  embeds: [embed],
  components: [new ActionRowBuilder().addComponents(select)],
});

// --- 6. Collector ---
const filter = (i) => i.user.id === message.author.id;
const collector = m.createMessageComponentCollector({ filter });

collector.on("collect", async (i) => {
  const specialCategories = [
    "plant_budget",
    "plant_comp",
    "plant_all",
    "plant_meme",
    "plant_aggro",
    "plant_midrange",
    "plant_combo",
    "plant_control",
    "plant_tempo",
    "zombie_comp",
    "zombie_budget",
    "zombie_all",
    "zombie_meme",
    "zombie_aggro",
    "zombie_midrange",
    "zombie_combo",
    "zombie_control",
    "zombie_tempo",
  ];

  try {
    if (i.isStringSelectMenu()) {
      const selectMap = {
        budgetpdecks: "plant_budget",
        comppdecks: "plant_comp",
        ladderpdecks: "plant_ladder",
        memepdecks: "plant_meme",
        aggropdecks: "plant_aggro",
        combopdecks: "plant_combo",
        controlpdecks: "plant_control",
        midrangepdecks: "plant_midrange",
        tempopdecks: "plant_tempo",
        allpdecks: "plant_all",
        budgetzdecks: "zombie_budget",
        compzdecks: "zombie_comp",
        ladderzdecks: "zombie_ladder",
        memezdecks: "zombie_meme",
        aggrozdecks: "zombie_aggro",
        combozdecks: "zombie_combo",
        controlzdecks: "zombie_control",
        midrangezdecks: "zombie_midrange",
        tempozdecks: "zombie_tempo",
        allzdecks: "zombie_all",
      };
      const key = selectMap[i.values[0]];
      const list = deckLists[key] || [];
      if (!key || !categoryEmbeds[key])
        return i.reply({
          content: "Invalid selection.",
          flags: MessageFlags.Ephemeral,
        });
      if (list.length === 0)
        return i.reply({
          content: "No decks in that category.",
          flags: MessageFlags.Ephemeral,
        });
      // If only one deck, reply with that deck's embed
      if (
        list.length === 1 &&
        typeof list[0] === "object" &&
        list[0] !== null
      ) {
        const singleEmbed = buildDeckEmbed(list[0], "Random");
        return i.reply({
          embeds: [singleEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }
      // Otherwise, show category embed and nav buttons
      const catEmbed = categoryEmbeds[key];
      const firstIndex = 0;
      const lastIndex = Math.max(0, list.length - 1);
      const leftId = `nav_${key}_${lastIndex}${
        lastIndex === firstIndex ? "_alt" : ""
      }`;
      const rightId = `nav_${key}_${firstIndex}`;
      const leftBtn = new ButtonBuilder()
        .setCustomId(leftId)
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary);
      const rightBtn = new ButtonBuilder()
        .setCustomId(rightId)
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary);
      const actionRow = new ActionRowBuilder().addComponents(
        leftBtn,
        rightBtn
      );
      return i.update({ embeds: [catEmbed], components: [actionRow] });
    }

    if (i.isButton()) {
      const parts = i.customId.split("_");
      const action = parts[0];

      if (action === "nav") {
        const category = parts.slice(1, -1).join("_");
        const index = Math.max(
          0,
          Math.min(
            Number.parseInt(parts.at(-1), 10),
            (deckLists[category] || []).length - 1
          )
        );
        const list = deckLists[category] || [];
        if (!list[index])
          return i.reply({
            content: "Deck not found.",
            flags: MessageFlags.Ephemeral,
          });
        const embed = buildDeckEmbed(list[index], "Random");
        const nav = buildNavRow(
          category,
          index,
          list.length,
          specialCategories
        );
        return i.update({ embeds: [embed], components: [nav] });
      }
      if (action === "back" && parts[1] === "to" && parts[2] === "list") {
        const category = parts.slice(3).join("_");
        const list = deckLists[category] || [];
        const catEmbed = categoryEmbeds[category];
        const firstIndex = 0;
        const lastIndex = Math.max(0, list.length - 1);
        const leftId = `nav_${category}_${lastIndex}${
          lastIndex === firstIndex ? "_alt" : ""
        }`;
        const rightId = `nav_${category}_${firstIndex}`;
        const leftBtn = new ButtonBuilder()
          .setCustomId(leftId)
          .setEmoji("⬅️")
          .setStyle(ButtonStyle.Primary);
        const rightBtn = new ButtonBuilder()
          .setCustomId(rightId)
          .setEmoji("➡️")
          .setStyle(ButtonStyle.Primary);
        const actionRow = new ActionRowBuilder().addComponents(
          leftBtn,
          rightBtn
        );
        return i.update({ embeds: [catEmbed], components: [actionRow] });
      }

      // fallback: unknown customId
      return i.reply({
        content: "Unknown button.",
        flags: MessageFlags.Ephemeral,
      });
    }
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
    } catch (err) {
      console.error(err);
    }
  },
};
