const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const axios = require("axios");
const {validateDeckImage} = require('../../features/decks/validateDeckImage.js');
const buildDeckEmbedFromRow = require("../../features/decks/buildDeckEmbedFromRow.js");
const dbTableColors = require("../../lib/db/dbTableColors.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submitdeckupdate")
    .setDescription("Submit an update to a PvZ Heroes decklist in Tbot")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the deck to update")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("deck_cost")
        .setDescription("The cost of the deck")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("The hero of the deck")
        .addChoices(
          { name: "Captain Combustible", value: "1100172143603482786" },
          { name: "Chompzilla", value: "1100171601045106819" },
          {name: "Beta-Carrotina", value: "1100171558263193700"},
          { name: "Citron", value: "1100171558263193700" },
          { name: "Grass Knuckles", value: "1100171819148906628" },
          { name: "Green Shadow", value: "1100172254983241820" },
          { name: "Night Cap", value: "1100171997167747172" },
          { name: "Rose", value: "1100171855316406343" },
          { name: "Solar Flare", value: "1100171646557491220" },
          { name: "Spudow", value: "1100171758256013412" },
          { name: "Wall Knight", value: "1100171712391295006" },
          { name: "Brain Freeze", value: "1100170721994477668" },
          { name: "Electric Boogaloo", value: "1100171042380578857" },
          {name: "Super Brainz", value: "1100170925208502282"},
          { name: "Huge Gigantacus", value: "1100170925208502282" },
          { name: "Impfinity", value: "1100170791594762260" },
          { name: "Immorticia", value: "1100171253790285904" },
          { name: "Neptuna", value: "1100170647050649620" },
          { name: "Rustbolt", value: "1100171459785150585" },
          { name: "Professor Brainstorm", value: "1100171115504078901" },
          { name: "Smash", value: "1100171177529446492" },
          { name: "Zmech", value: "1100170981013729410" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("deck_creator")
        .setDescription(
          "Put creators name. feel free to add optimized by: your name if you want credits"
        )
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("image of the decklist")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Short description of the deck (optional)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("deck_archetype")
        .setDescription("The archetype for the deck (optional)")
        .setRequired(false)
        .addChoices(
          { name: 'Aggro', value: 'Aggro'},
        { name: 'Control', value: 'Control'},
        { name: 'Combo', value: 'Combo'},
        { name: 'Midrange', value: 'Midrange'},
        { name: "Tempo", value: 'Tempo'}, 
        {name: 'Aggro Combo', value: 'Aggro Combo'},
        {name: 'Combo Midrange', value: 'Combo Midrange'},
        {name: 'Control Combo', value: 'Control Combo'},
        {name: 'Combo Tempo', value: 'Combo Tempo'},
        {name: 'Midrange Tempo', value: 'Midrange Tempo'}
        )
    )
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The type of deck it is (optional)")
        .setRequired(false)
        .addChoices(
          { name: "Budget", value: "Budget" },
          { name: "Competitive", value: "Competitive" },
          { name: "Ladder", value: "Ladder" },
          { name: "Meme", value: "Meme" }
        )
    ),
  async autocomplete(interaction) {
    try {
      const db = require("../../../index.js");
      const focusedValue = interaction.options.getFocused();
      const [rows] = await db.query(`SELECT name FROM tbot_decks ORDER BY name COLLATE utf8mb4_general_ci ASC`);

      const choices = [
        ...new Set(rows.map((r) => r.name.toLowerCase().replaceAll(/\s+/g, "")))
      ].sort((a, b) => a.localeCompare(b));
      let filtered;
     if (focusedValue) {
        filtered = choices
          .filter((choice) =>
            choice.startsWith(focusedValue.toLowerCase().replaceAll(/\s+/g, ""))
          )
          .slice(0, 25);
      } else {
        filtered = choices.slice(0, 25);
      }
      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (err) {
      console.error("Autocomplete error:", err);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    // Defer reply since validation may take time
    await interaction.deferReply();
    
    const db = require("../../../index.js");
        const heroDeckMap = {
        "1100172143603482786": "Captain Combustible",
        "1100171601045106819": "Chompzilla",
        "1100171558263193700": "Citron/BC",
        "1100171819148906628": "Grass Knuckles",
        "1100172254983241820": "Green Shadow",
        "1100171997167747172": "Night Cap",
        "1100171855316406343": "Rose",
        "1100171646557491220": "Solar Flare",
        "1100171758256013412": "Spudow",
        "1100171712391295006": "Wall-Knight",
        "1100170721994477668": "Brain Freeze",
        "1100171042380578857": "Electric Boogaloo",
        "1100170925208502282": "Huge-Gigantacus/SB",
        "1100170791594762260": "Impfinity",
        "1100171253790285904": "Immorticia",
        "1100170647050649620": "Neptuna",
        "1100171459785150585": "Rustbolt",
        "1100171115504078901": "Professor Brainstorm",
        "1100171177529446492": "The Smash",
        "1100170981013729410": "Z-Mech",
      };

      const heroId = interaction.options.getString("hero");
    const tableName = heroDeckMap[heroId];
    const name = interaction.options.getString("name");
    const normalizedName = name.toLowerCase().replaceAll(/\s+/g, "");
    
    // Verify hero ID is valid
    if (!tableName && heroId !== "1100171558263193700" && heroId !== "1100170925208502282") {
      return interaction.editReply({
        content: `❌ Invalid hero selection. Hero ID: ${heroId}`,
        flags: MessageFlags.Ephemeral
      });
    }
    
    let rows;
    let heroName = heroDeckMap[heroId];

    if (heroId === "1100171558263193700") {
      [rows] = await db.query(
        `SELECT * FROM tbot_decks
         WHERE LOWER(REPLACE(name, ' ', '')) = ?
           AND LOWER(side) = 'plants'`,
        [normalizedName]
      );
    } else if (heroId === "1100170925208502282") {
      [rows] = await db.query(
        `SELECT * FROM tbot_decks
         WHERE LOWER(REPLACE(name, ' ', '')) = ?
           AND LOWER(side) = 'zombies'`,
        [normalizedName]
      );
    } else {
      [rows] = await db.query(
        `SELECT * FROM tbot_decks
         WHERE LOWER(hero) = LOWER(?)
           AND LOWER(REPLACE(name, ' ', '')) = ?
         LIMIT 1`,
        [heroName, normalizedName]
      );
    }

    if (rows.length === 0) {
      return interaction.editReply({
        content:
        `❌ Invalid hero name. Please make sure the deck exists in the selected hero's commands by checking <@${interaction.client.id}> heroname.`,
        flags: MessageFlags.Ephemeral
      });
    }
    const deckRow = rows[0];
    const resolvedTableName = "tbot_decks";
    const description = interaction.options.getString("description");
    const decktype = interaction.options.getString("category");
    const deckarchetype = interaction.options.getString("deck_archetype");
    const image = interaction.options.getAttachment("image");
    const deckcost = interaction.options.getInteger("deck_cost");
    const hero = interaction.options.getString("hero");
    const deckcreator = interaction.options.getString("deck_creator");
    const imageUrl = image.url;

    // Validate the deck image
    console.log(`[updatedeck] Validating deck image for: ${name}`);
    const validation = await validateDeckImage(imageUrl);
    
    if (!validation.isValid) {
      console.log(`[updatedeck] Validation failed:`, validation);
      return interaction.editReply({
        content: `❌ **Invalid image detected!**\n\n` +
          `The uploaded image doesn't appear to be a PvZ Heroes deck screenshot.\n\n` +
          `Debug Info:\n` +
          `\`\`\`\n` +
          `Flags: ${validation.flags?.join(', ') || 'none'}\n` +
          `Critical Flags: ${validation.criticalFlags?.join(', ') || 'none'}\n` +
          `Reason: ${validation.reason || 'unknown'}\n` +
          `\`\`\`\n\n` +
          `Please ensure you're uploading:\n` +
          `• A full deck screenshot from PvZ Heroes (not cropped)\n` +
          `• The "40/40" deck size is visible\n` +
          `• Card quantities (x1, x2, x3, x4) are visible\n` +
          `• No annotations or overlays\n` +
          `• A clear, readable screenshot\n\n` +
          `If you believe this is an error, please contact <@625172218120372225>.`,
        flags: MessageFlags.Ephemeral
      });
    }

    console.log(`[updatedeck] Validation passed for: ${name}`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "utf-8");
    const file = new AttachmentBuilder(buffer, { name: "deck.png" });
    const tbotServer = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Tbot Server")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/2NSwt96vmS")
    );
    const editReplyResponse = await interaction.editReply({
      content: `✅ Your deck update has  been submitted successfully! Please join the tbot server below if you haven't already to be notified of updates on your submission or of updates to the bot`,
      files: [file],
      components: [tbotServer],
      withResponse: true,
    });
    const replyMessage = editReplyResponse.resource?.message ||
      (typeof interaction.fetchReply === "function" ? await interaction.fetchReply() : null);
    if (!replyMessage) {
      return interaction.editReply({
        content: "❌ Could not fetch the submission message.",
        flags: MessageFlags.Ephemeral
      });
    }
    const permanentUrl = replyMessage.attachments.first().url;
    const forumChannel = interaction.client.channels.cache.get(
      "1100160031128830104"
    );

    if (!forumChannel || forumChannel?.type !== ChannelType.GuildForum) {
      return interaction.editReply({
        content: "❌ Forum channel not found or invalid.",
        flags: MessageFlags.Ephemeral
      });
    }
    const fields = [
      {
        name: "Deck Cost",
        value: `${deckcost.toString()}<:spar:1057791557387956274>`,
        inline: true,
      },
    ];
    if (decktype) {
      fields.push({
        name: "Category",
        value: `**__${decktype}__**`,
        inline: true,
      });
    }
    if (deckarchetype) {
      fields.push({
        name: "Deck Archetype",
        value: `**__${deckarchetype}__**`,
        inline: true,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle(`Update ${name}`)
      .setDescription(description)
      .addFields(fields)
      .setColor("Random")
      .setFooter({
        text: `Created By ${deckcreator} | Submitted by ${interaction.user.tag}`,
      });

    if (image?.contentType?.startsWith("image/")) {
      embed.setImage(permanentUrl);
    }

    // Create the thread in the forum
    const thread = await forumChannel.threads.create({
      name: `${name} needs an update`,
      message: {
        embeds: [embed],
      },
      appliedTags: [hero],
    });
    const starterMessage = await thread.fetchStarterMessage();
    await starterMessage.pin();
    await starterMessage.react("<:upvote:1081953853903220876>");
    await starterMessage.react("<:downvote:1081953860534403102>");
    const previousInfoEmbed = buildDeckEmbedFromRow(deckRow, resolvedTableName, dbTableColors);
    const previousInfoMessage = await thread.send({
      embeds: [previousInfoEmbed],
    });
    await previousInfoMessage.pin();
  },
};