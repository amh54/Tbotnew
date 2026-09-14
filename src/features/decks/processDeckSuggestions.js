const {
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const SUGGESTION_CHECK_INTERVAL = 30 * 1000;

const DECK_SUGGESTION_FORUM_ID = "1100160031128830104";

const WEBSITE_SUGGESTION_FORUM_ID = "1547224571676196964";

const WEBSITE_SUGGESTION_TAG_MAP = {
  improvement: "1548396026736672828",
  ui: "1548396183574020126",
  feature: "1548396322141372466",
  performance: "1548396738199425055",
  other: "1548396818013094039",
};

const UPVOTE_EMOJI = "<:upvote:1081953853903220876>";
const DOWNVOTE_EMOJI = "<:downvote:1081953860534403102>";

let watcherRunning = false;

function getHeroTags(hero) {
  const normalizedHero = String(hero || "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, "");

  const heroTagMap = {
    captaincombustible: ["1100172143603482786"],
    chompzilla: ["1100171601045106819"],
    betacarrotina: ["1100171558263193700"],
    citron: ["1100171558263193700"],
    grassknuckles: ["1100171819148906628"],
    greenshadow: ["1100172254983241820"],
    nightcap: ["1100171997167747172"],
    rose: ["1100171855316406343"],
    solarflare: ["1100171646557491220"],
    spudow: ["1100171758256013412"],
    wallknight: ["1100171712391295006"],
    brainfreeze: ["1100170721994477668"],
    electricboogaloo: ["1100171042380578857"],
    superbrainz: ["1100170925208502282"],
    hugegigantacus: ["1100170925208502282"],
    impfinity: ["1100170791594762260"],
    immorticia: ["1100171253790285904"],
    neptuna: ["1100170647050649620"],
    rustbolt: ["1100171459785150585"],
    professorbrainstorm: ["1100171115504078901"],
    smash: ["1100171177529446492"],
    zmech: ["1100170981013729410"],
  };

  return heroTagMap[normalizedHero] || [];
}

function valuesDiffer(a, b) {
  return String(a ?? "") !== String(b ?? "");
}

function suggestionNeedsUpdate(suggestion, deck) {
  const fields = [
    "name",
    "hero",
    "side",
    "category",
    "archetype",
    "creator",
    "description",
    "image",
    "cost",
    "aliases",
    "cards",
    "inspiration",
    "optimization",
    "suggested_date",
    "updated_date",
    "deck_doc",
  ];

  const fieldMap = {
    name: "deck_name",
  };

  return fields.some((field) => {
    const suggestionField = fieldMap[field] || field;
    return valuesDiffer(deck[field], suggestion[suggestionField]);
  });
}

function buildSuggestionEmbed(suggestion) {
  const suggestedBy =
    suggestion.suggested_by_display_name ||
    suggestion.suggested_by_username ||
    "Unknown user";

  const fields = [
    {
      name: "Category",
      value: `**__${suggestion.category || "Unknown"}__**`,
      inline: true,
    },
    {
      name: "Deck Archetype",
      value: `**__${suggestion.archetype || "Unknown"}__**`,
      inline: true,
    },
    {
      name: "Deck Cost",
      value: `${suggestion.cost || "Unknown"}<:spar:1057791557387956274>`,
      inline: true,
    },
  ];

  if (suggestion.aliases && suggestion.aliases.trim() !== "") {
    fields.push({
      name: "Aliases",
      value: suggestion.aliases,
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(suggestion.deck_name || "Untitled Deck")
    .setDescription(suggestion.description || "No description provided.")
    .addFields(fields)
    .setColor("Random")
    .setFooter({
      text: `Created By ${
        suggestion.creator || "Unknown"
      } | Suggested by ${suggestedBy}`,
    });

  if (suggestion.image) {
    embed.setImage(suggestion.image);
  }

  return embed;
}

function getWebsiteSuggestionCategoryLabel(category) {
  const labels = {
    improvement: "Improvement",
    ui: "UI / Design",
    feature: "Feature",
    performance: "Performance",
    other: "Other",
  };

  return labels[String(category || "").toLowerCase()] || "Other";
}

function getWebsiteSuggestionTag(category) {
  const normalizedCategory = String(category || "")
    .trim()
    .toLowerCase();

  return WEBSITE_SUGGESTION_TAG_MAP[normalizedCategory] || null;
}

function buildWebsiteSuggestionEmbed(suggestion) {
  const category = String(suggestion.category || "")
    .trim()
    .toLowerCase();

  const categoryLabel = getWebsiteSuggestionCategoryLabel(category);
  const suggestedBy = suggestion.discord_username || "Unknown user";

  const fields = [
    {
      name: "Category",
      value: `**__${categoryLabel}__**`,
      inline: true,
    },
  ];

  if (category === "improvement" && suggestion.page_url) {
    fields.push({
      name: "Page",
      value: suggestion.page_url,
      inline: false,
    });
  }

  return new EmbedBuilder()
    .setTitle(suggestion.title || "Website Suggestion")
    .setDescription(suggestion.description || "No description provided.")
    .addFields(fields)
    .setColor("Random")
    .setFooter({
      text: `Suggested by ${suggestedBy}`,
    });
}

async function startDeckSuggestionWatcher(client) {
  if (watcherRunning) {
    console.log("[Suggestions] Watcher already running.");
    return;
  }

  watcherRunning = true;

  console.log("[Suggestions] Watcher started.");

  await processDeckSuggestions(client);
  await processWebsiteSuggestions(client);

  setInterval(async () => {
    await processDeckSuggestions(client);
    await processWebsiteSuggestions(client);
  }, SUGGESTION_CHECK_INTERVAL);
}

async function processDeckSuggestions(client) {
  try {
    const db = require("../../../index.js");

    const consentResult = await db.query(`
      SELECT *
      FROM user_deck_suggestions
      WHERE status = 'pending'
        AND consent_status = 'awaiting_creator'
        AND consent_request_sent = FALSE
      ORDER BY created_at ASC
    `);

    const consentSuggestions = consentResult.rows || [];

    for (const suggestion of consentSuggestions) {
      await sendConsentRequest(client, db, suggestion);
    }

    const forumChannel = client.channels.cache.get(DECK_SUGGESTION_FORUM_ID);

    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      console.error("[Deck Suggestions] Forum channel not found or invalid.");
      return;
    }

    const result = await db.query(`
      SELECT *
      FROM user_deck_suggestions
      WHERE status = 'pending'
        AND consent_status = 'confirmed'
      ORDER BY created_at ASC
    `);

    const suggestions = result.rows || [];

    for (const suggestion of suggestions) {
      if (!suggestion.discord_thread_id) {
        await processSingleSuggestion(db, forumChannel, suggestion);
      } else {
        await syncExistingSuggestion(db, forumChannel, suggestion);
      }
    }
  } catch (error) {
    console.error("[Deck Suggestions] Error processing suggestions:", error);
  }
}

async function sendConsentRequest(client, db, suggestion) {
  try {
    if (suggestion.consent_request_sent) {
      return;
    }

    if (!suggestion.consent_creator_discord_id) {
      console.error(
        `[Deck Suggestions] Suggestion #${suggestion.id} has no creator Discord ID.`,
      );
      return;
    }

    const creator = await client.users.fetch(
      suggestion.consent_creator_discord_id,
    );

    const suggestedBy =
      suggestion.suggested_by_display_name ||
      suggestion.suggested_by_username ||
      "Unknown user";

    const embed = new EmbedBuilder()
      .setTitle("Deck Suggestion Permission Request")
      .setDescription(
        `**${suggestedBy}** wants to suggest your deck **${suggestion.deck_name}** to the Tbot Discord deck suggestion forum.\n\n` +
          "Do you give permission for this deck to be suggested?",
      )
      .addFields(
        {
          name: "Hero",
          value: suggestion.hero || "Unknown",
          inline: true,
        },
        {
          name: "Side",
          value: suggestion.side || "Unknown",
          inline: true,
        },
        {
          name: "Category",
          value: suggestion.category || "Unknown",
          inline: true,
        },
        {
          name: "Archetype",
          value: suggestion.archetype || "Unknown",
          inline: true,
        },
      )
      .setColor("Random");

    if (suggestion.image) {
      embed.setImage(suggestion.image);
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`decksuggestion_consent_yes_${suggestion.id}`)
        .setLabel("Yes, Allow")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`decksuggestion_consent_no_${suggestion.id}`)
        .setLabel("No, Decline")
        .setStyle(ButtonStyle.Danger),
    );

    await creator.send({
      embeds: [embed],
      components: [buttons],
    });

    await db.query(
      `
        UPDATE user_deck_suggestions
        SET consent_request_sent = TRUE
        WHERE id = $1
      `,
      [suggestion.id],
    );

    console.log(
      `[Deck Suggestions] Sent consent request for suggestion #${suggestion.id} to ${creator.tag}.`,
    );
  } catch (error) {
    console.error(
      `[Deck Suggestions] Failed to send consent request for suggestion #${suggestion.id}:`,
      error,
    );
  }
}

async function processSingleSuggestion(db, forumChannel, suggestion) {
  try {
    console.log(
      `[Deck Suggestions] Processing suggestion #${suggestion.id}: ${suggestion.deck_name}`,
    );

    const appliedTags = getHeroTags(suggestion.hero);

    if (!appliedTags.length) {
      console.error(
        `[Deck Suggestions] No forum tag configured for hero "${suggestion.hero}" on suggestion #${suggestion.id}.`,
      );
      return;
    }

    const availableTags = forumChannel.availableTags || [];

    const validTags = appliedTags.filter((tagId) =>
      availableTags.some((tag) => String(tag.id) === String(tagId)),
    );

    if (!validTags.length) {
      console.error(
        `[Deck Suggestions] Configured hero tag for "${suggestion.hero}" does not exist on forum channel ${forumChannel.id}.`,
      );
      return;
    }

    const embed = buildSuggestionEmbed(suggestion);

    const thread = await forumChannel.threads.create({
      name: suggestion.deck_name || "Deck Suggestion",
      autoArchiveDuration: 10080,
      appliedTags: validTags,
      message: {
        embeds: [embed],
      },
    });

    const starterMessage = await thread.fetchStarterMessage();

    if (starterMessage) {
      await starterMessage.pin();
      await starterMessage.react(UPVOTE_EMOJI);
      await starterMessage.react(DOWNVOTE_EMOJI);
    }

    await db.query(
      `
        UPDATE user_deck_suggestions
        SET
          discord_thread_id = $1,
          discord_message_id = $2
        WHERE id = $3
      `,
      [
        thread.id,
        starterMessage ? starterMessage.id : null,
        suggestion.id,
      ],
    );

    console.log(
      `[Deck Suggestions] Created thread ${thread.id} for suggestion #${suggestion.id}.`,
    );
  } catch (error) {
    console.error(
      `[Deck Suggestions] Failed to process suggestion #${suggestion.id}:`,
      error,
    );
  }
}

async function syncExistingSuggestion(db, forumChannel, suggestion) {
  try {
    const deckResult = await db.query(
      `
        SELECT *
        FROM user_decks
        WHERE id = $1
        LIMIT 1
      `,
      [suggestion.deck_id],
    );

    const deck = deckResult.rows?.[0];

    if (!deck) {
      console.log(
        `[Deck Suggestions] Original deck #${suggestion.deck_id} no longer exists for suggestion #${suggestion.id}.`,
      );
      return;
    }

    if (!suggestionNeedsUpdate(suggestion, deck)) {
      return;
    }

    console.log(
      `[Deck Suggestions] Changes detected for suggestion #${suggestion.id}. Updating Discord thread.`,
    );

    const updatedSuggestion = {
      ...suggestion,
      deck_name: deck.name,
      hero: deck.hero,
      side: deck.side,
      category: deck.category,
      archetype: deck.archetype,
      creator: deck.creator,
      description: deck.description,
      image: deck.image,
      cost: deck.cost,
      aliases: deck.aliases,
      cards: deck.cards,
      inspiration: deck.inspiration,
      optimization: deck.optimization,
      suggested_date: deck.suggested_date,
      updated_date: deck.updated_date,
      deck_doc: deck.deck_doc,
    };

    const thread = await forumChannel.threads
      .fetch(suggestion.discord_thread_id)
      .catch(() => null);

    if (!thread) {
      console.error(
        `[Deck Suggestions] Could not fetch Discord thread ${suggestion.discord_thread_id} for suggestion #${suggestion.id}.`,
      );
      return;
    }

    const embed = buildSuggestionEmbed(updatedSuggestion);

    let starterMessage = null;

    if (suggestion.discord_message_id) {
      starterMessage = await thread.messages
        .fetch(suggestion.discord_message_id)
        .catch(() => null);
    }

    if (!starterMessage) {
      starterMessage = await thread.fetchStarterMessage().catch(() => null);
    }

    if (starterMessage) {
      await starterMessage.edit({
        embeds: [embed],
      });
    } else {
      console.error(
        `[Deck Suggestions] Could not find starter message for suggestion #${suggestion.id}.`,
      );
      return;
    }

    if (valuesDiffer(suggestion.deck_name, updatedSuggestion.deck_name)) {
      await thread.setName(updatedSuggestion.deck_name || "Deck Suggestion");
    }

    const appliedTags = getHeroTags(updatedSuggestion.hero);
    const availableTags = forumChannel.availableTags || [];

    const validTags = appliedTags.filter((tagId) =>
      availableTags.some((tag) => String(tag.id) === String(tagId)),
    );

    if (validTags.length) {
      const currentTags = thread.appliedTags || [];
      const normalizedCurrentTags = currentTags.map((tagId) => String(tagId));
      const normalizedValidTags = validTags.map((tagId) => String(tagId));

      const tagsChanged =
        normalizedCurrentTags.length !== normalizedValidTags.length ||
        normalizedCurrentTags.some(
          (tagId) => !normalizedValidTags.includes(tagId),
        );

      if (tagsChanged) {
        await thread.setAppliedTags(validTags);
      }
    }

    await db.query(
      `
        UPDATE user_deck_suggestions
        SET
          deck_name = $1,
          hero = $2,
          side = $3,
          category = $4,
          archetype = $5,
          creator = $6,
          description = $7,
          image = $8,
          cost = $9,
          aliases = $10,
          cards = $11,
          inspiration = $12,
          optimization = $13,
          suggested_date = $14,
          updated_date = $15,
          deck_doc = $16,
          discord_message_id = $17,
          updated_at = NOW()
        WHERE id = $18
      `,
      [
        updatedSuggestion.deck_name,
        updatedSuggestion.hero,
        updatedSuggestion.side,
        updatedSuggestion.category,
        updatedSuggestion.archetype,
        updatedSuggestion.creator,
        updatedSuggestion.description,
        updatedSuggestion.image,
        updatedSuggestion.cost,
        updatedSuggestion.aliases,
        updatedSuggestion.cards,
        updatedSuggestion.inspiration,
        updatedSuggestion.optimization,
        updatedSuggestion.suggested_date,
        updatedSuggestion.updated_date,
        updatedSuggestion.deck_doc,
        starterMessage
          ? starterMessage.id
          : suggestion.discord_message_id,
        suggestion.id,
      ],
    );

    console.log(
      `[Deck Suggestions] Updated Discord thread ${thread.id} for suggestion #${suggestion.id}.`,
    );
  } catch (error) {
    console.error(
      `[Deck Suggestions] Failed to sync suggestion #${suggestion.id}:`,
      error,
    );
  }
}

async function processWebsiteSuggestions(client) {
  try {
    const db = require("../../../index.js");

    const forumChannel = client.channels.cache.get(
      WEBSITE_SUGGESTION_FORUM_ID,
    );

    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      console.error(
        "[Website Suggestions] Forum channel not found or invalid.",
      );
      return;
    }

    const result = await db.query(`
      SELECT *
      FROM user_suggestions
      WHERE status = 'pending'
        AND discord_thread_id IS NULL
      ORDER BY created_at ASC
    `);

    const suggestions = result.rows || [];

    for (const suggestion of suggestions) {
      await processSingleWebsiteSuggestion(
        db,
        forumChannel,
        suggestion,
      );
    }
  } catch (error) {
    console.error(
      "[Website Suggestions] Error processing suggestions:",
      error,
    );
  }
}

async function processSingleWebsiteSuggestion(
  db,
  forumChannel,
  suggestion,
) {
  try {
    console.log(
      `[Website Suggestions] Processing suggestion #${suggestion.id}: ${suggestion.title}`,
    );

    const tagId = getWebsiteSuggestionTag(suggestion.category);

    if (!tagId) {
      console.error(
        `[Website Suggestions] No forum tag configured for category "${suggestion.category}" on suggestion #${suggestion.id}.`,
      );
      return;
    }

    const availableTags = forumChannel.availableTags || [];

    const validTag = availableTags.find(
      (tag) => String(tag.id) === String(tagId),
    );

    if (!validTag) {
      console.error(
        `[Website Suggestions] Configured tag ${tagId} does not exist on forum channel ${forumChannel.id} for suggestion #${suggestion.id}.`,
      );
      return;
    }

    const embed = buildWebsiteSuggestionEmbed(suggestion);

    const thread = await forumChannel.threads.create({
      name: suggestion.title || "Website Suggestion",
      autoArchiveDuration: 10080,
      appliedTags: [validTag.id],
      message: {
        embeds: [embed],
      },
    });

    const starterMessage = await thread.fetchStarterMessage();

    if (starterMessage) {
      await starterMessage.pin();
      await starterMessage.react(UPVOTE_EMOJI);
      await starterMessage.react(DOWNVOTE_EMOJI);
    }

    const discordThreadUrl = `https://discord.com/channels/${thread.guild.id}/${thread.id}`;

    console.log(
      `[Website Suggestions] Saving Discord thread data for suggestion #${suggestion.id}:`,
      {
        threadId: thread.id,
        messageId: starterMessage ? starterMessage.id : null,
        threadUrl: discordThreadUrl,
      },
    );

    const updateResult = await db.query(
      `
        UPDATE user_suggestions
        SET
          discord_thread_id = $1,
          discord_message_id = $2,
          discord_thread_url = $3,
          updated_at = NOW()
        WHERE id = $4
      `,
      [
        thread.id,
        starterMessage ? starterMessage.id : null,
        discordThreadUrl,
        suggestion.id,
      ],
    );

    console.log(
      `[Website Suggestions] Database update affected ${updateResult.rowCount} row(s) for suggestion #${suggestion.id}.`,
    );

    if (updateResult.rowCount !== 1) {
      console.error(
        `[Website Suggestions] WARNING: Discord thread was created, but database update affected ${updateResult.rowCount} rows for suggestion #${suggestion.id}.`,
      );
      return;
    }

    console.log(
      `[Website Suggestions] Created thread ${thread.id} for suggestion #${suggestion.id} and saved Discord metadata.`,
    );
  } catch (error) {
    console.error(
      `[Website Suggestions] Failed to process suggestion #${suggestion.id}:`,
      error,
    );
  }
}
module.exports = {
  startDeckSuggestionWatcher,
};