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
const SITE_UPDATES_CHANNEL_ID = "1532126385873616976";

const COMPLETED_EMOJI = "✅";
const DECLINED_EMOJI = "❌";

let latestSiteUpdateId = null;
let watcherRunning = false;

const WEBSITE_SUGGESTION_TAG_MAP = {
  improvement: "1548396026736672828",
  ui: "1548396183574020126",
  feature: "1548396322141372466",
  performance: "1548396738199425055",
  other: "1548396818013094039",
};

const UPVOTE_EMOJI = "<:upvote:1081953853903220876>";
const DOWNVOTE_EMOJI = "<:downvote:1081953860534403102>";

const buildDeckEmbedFromRow = require("../../features/decks/buildDeckEmbedFromRow.js");
const dbTableColors = require("../../lib/db/dbTableColors.js");

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

function buildSuggestionEmbed(suggestion, existingDeck = null) {
  const isUpdate = suggestion.suggestion_type === "update";

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
      value: `${suggestion.cost ?? "Unknown"}<:spar:1057791557387956274>`,
      inline: true,
    },
  ];

  if (suggestion.aliases && String(suggestion.aliases).trim() !== "") {
    fields.push({
      name: "Aliases",
      value: String(suggestion.aliases),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(
      isUpdate
        ? `Update ${existingDeck?.name || "Untitled Deck"}`
        : suggestion.deck_name || "Untitled Deck",
    )
    .setDescription(suggestion.description || "No description provided.")
    .addFields(fields)
    .setColor("Random")
    .setFooter({
      text: `Created By ${suggestion.creator || "Unknown"} | Suggested by ${suggestedBy}`,
    });

  if (suggestion.image) {
    embed.setImage(suggestion.image);
  }

  return embed;
}

function getSiteUpdateCategoryLabel(category) {
  const labels = {
    new_feature: "New Feature",
    improvement: "Improvement",
    bug_fix: "Bug Fix",
    data: "Data",
    announcement: "Announcement",
    ui_design: "UI / Design",
    new_deck: "New Deck",
    deck_update: "Deck Update",
    deleted_deck: "Deleted Deck",
    other: "Other",
  };

  const normalizedCategory = String(category || "")
    .trim()
    .toLowerCase();

  return (
    labels[normalizedCategory] ||
    normalizedCategory
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()) ||
    "Update"
  );
}

function formatSiteUpdateDiscordContent(content) {
  return String(content || "").replace(
    /\]\((\/[^)\s]*)\)/g,
    "](https://pvzhtbot.com$1)",
  );
}

function buildSiteUpdateEmbed(update) {
  const fields = [
    {
      name: "Category",
      value: `**__${getSiteUpdateCategoryLabel(update.category)}__**`,
      inline: true,
    },
  ];

  if (update.page_url) {
    fields.push({
      name: "Related Page",
      value: `[View Page](${update.page_url})`,
      inline: true,
    });
  }

  return new EmbedBuilder()
    .setTitle(update.title || "Tbot Site Update")
    .setDescription(
      formatSiteUpdateDiscordContent(
        update.content || "No update description provided.",
      ),
    )
    .addFields(fields)
    .setColor("Random")
    .setFooter({
      text: `Tbot Site Update #${update.id}`,
    });
}

async function initializeSiteUpdateWatcher() {
  try {
    const db = require("../../../index.js");

    const result = await db.query(`
      SELECT id
      FROM site_updates
      WHERE published = TRUE
      ORDER BY id DESC
      LIMIT 1
    `);

    latestSiteUpdateId = result.rows?.[0]?.id ? Number(result.rows[0].id) : 0;

    console.log(
      `[Site Updates] Watcher initialized at update #${latestSiteUpdateId}.`,
    );
  } catch (error) {
    console.error(
      "[Site Updates] Failed to initialize site update watcher:",
      error,
    );

    latestSiteUpdateId = 0;
  }
}

async function processSiteUpdates(client) {
  try {
    const db = require("../../../index.js");
    const channel = client.channels.cache.get(SITE_UPDATES_CHANNEL_ID);

    if (!channel || channel.type !== ChannelType.PublicThread) {
      console.error("[Site Updates] Thread channel not found or invalid.");
      return;
    }

    if (latestSiteUpdateId === null) {
      await initializeSiteUpdateWatcher();
      return;
    }

    const result = await db.query(
      `
        SELECT *
        FROM site_updates
        WHERE published = TRUE
          AND id > $1
        ORDER BY id ASC
      `,
      [latestSiteUpdateId],
    );

    const updates = result.rows || [];

    if (!updates.length) {
      return;
    }

    const roles = await channel.guild.roles.fetch();
    const role = roles.find(
      (guildRole) => guildRole.name.toLowerCase() === "web updates",
    );

    for (const update of updates) {
      const embed = buildSiteUpdateEmbed(update);

      await channel.send({
        content: role?.id ? `<@&${role.id}>` : undefined,
        embeds: [embed],
        allowedMentions: {
          parse: [],
          roles: role?.id ? [role.id] : [],
        },
      });

      latestSiteUpdateId = Number(update.id);

      console.log(
        `[Site Updates] Posted site update #${update.id}: ${update.title}`,
      );
    }
  } catch (error) {
    console.error("[Site Updates] Error processing site updates:", error);
  }
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

  if (suggestion.page_url) {
    fields.push({
      name: "Page",
      value: `[View Page](${suggestion.page_url})`,
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

  await initializeSiteUpdateWatcher();
  await processDeckSuggestions(client);
  await processWebsiteSuggestions(client);
  await processSiteUpdates(client);

  setInterval(async () => {
    await processDeckSuggestions(client);
    await processWebsiteSuggestions(client);
    await processSiteUpdates(client);
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

    for (const suggestion of consentResult.rows || []) {
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

    for (const suggestion of result.rows || []) {
      if (!suggestion.discord_thread_id) {
        await processSingleSuggestion(db, forumChannel, suggestion);
      } else {
        await syncExistingSuggestion(db, forumChannel, suggestion);
      }
    }

    await processCompletedAndDeclinedSuggestions(db, forumChannel);
  } catch (error) {
    console.error("[Deck Suggestions] Error processing suggestions:", error);
  }
}

async function syncExistingSuggestion(db, forumChannel, suggestion) {
  try {
    const isUpdate = suggestion.suggestion_type === "update";

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
      console.error(
        `[Deck Suggestions] Source deck not found for suggestion #${suggestion.id}; deck_id=${suggestion.deck_id}, type=${suggestion.suggestion_type}.`,
      );
      return;
    }

    const sourceModifiedAt = deck.modified_at
      ? new Date(deck.modified_at).getTime()
      : null;

    const lastSyncedAt = suggestion.last_synced_deck_modified_at
      ? new Date(suggestion.last_synced_deck_modified_at).getTime()
      : null;

    if (
      sourceModifiedAt !== null &&
      Number.isFinite(sourceModifiedAt) &&
      lastSyncedAt !== null &&
      Number.isFinite(lastSyncedAt) &&
      sourceModifiedAt === lastSyncedAt
    ) {
      return;
    }

    const fields = [
      ["deck_name", "name"],
      ["hero", "hero"],
      ["side", "side"],
      ["category", "category"],
      ["archetype", "archetype"],
      ["creator", "creator"],
      ["description", "description"],
      ["image", "image"],
      ["cost", "cost"],
      ["aliases", "aliases"],
    ];

    const changedFields = fields.filter(([suggestionField, deckField]) => {
      const suggestionValue = suggestion[suggestionField] ?? "";
      const deckValue = deck[deckField] ?? "";

      return JSON.stringify(suggestionValue) !== JSON.stringify(deckValue);
    });

    if (!changedFields.length) {
      if (sourceModifiedAt !== null && Number.isFinite(sourceModifiedAt)) {
        await db.query(
          `
            UPDATE user_deck_suggestions
            SET last_synced_deck_modified_at = $1
            WHERE id = $2
          `,
          [deck.modified_at, suggestion.id],
        );
      }

      return;
    }

    console.log(
      `[Deck Suggestions] Changes detected for #${suggestion.id}: ${changedFields
        .map(([field]) => field)
        .join(", ")}`,
    );

    console.log(
      `[Deck Suggestions] Differences for #${suggestion.id}:`,
      changedFields.map(([suggestionField, deckField]) => ({
        field: suggestionField,
        suggestion: suggestion[suggestionField],
        deck: deck[deckField],
      })),
    );

    let publishedDeck = null;

    if (isUpdate) {
      if (!suggestion.published_deckid) {
        console.error(
          `[Deck Suggestions] Update proposal #${suggestion.id} has no published_deckid.`,
        );
        return;
      }

      const publishedResult = await db.query(
        `
          SELECT *
          FROM web_decks
          WHERE deckid = $1
          LIMIT 1
        `,
        [suggestion.published_deckid],
      );

      publishedDeck = publishedResult.rows?.[0];

      if (!publishedDeck) {
        console.error(
          `[Deck Suggestions] Published deck #${suggestion.published_deckid} not found for proposal #${suggestion.id}.`,
        );
        return;
      }
    }

    const thread = await forumChannel.threads
      .fetch(suggestion.discord_thread_id)
      .catch(() => null);

    if (!thread) {
      console.error(
        `[Deck Suggestions] Could not fetch thread for suggestion #${suggestion.id}.`,
      );
      return;
    }

    const message = await thread.messages
      .fetch(suggestion.discord_message_id)
      .catch(() => null);

    if (!message) {
      console.error(
        `[Deck Suggestions] Could not fetch message for suggestion #${suggestion.id}.`,
      );
      return;
    }

    const syncedSuggestion = {
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
    };

    await message.edit({
      embeds: [
        buildSuggestionEmbed(syncedSuggestion, isUpdate ? publishedDeck : null),
      ],
    });

    const expectedThreadName = isUpdate
      ? `${publishedDeck.name || "Untitled Deck"} needs an update`
      : deck.name || "Deck Suggestion";

    if (thread.name !== expectedThreadName) {
      await thread.setName(expectedThreadName);
    }

    const appliedTags = getHeroTags(deck.hero);
    const availableTags = forumChannel.availableTags || [];

    const validTags = appliedTags.filter((tagId) =>
      availableTags.some((tag) => String(tag.id) === String(tagId)),
    );

    if (validTags.length) {
      const currentTagIds = thread.appliedTags || [];

      const tagsChanged =
        currentTagIds.length !== validTags.length ||
        currentTagIds.some((tagId) => !validTags.includes(String(tagId)));

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
          last_synced_deck_modified_at = $11,
          updated_at = NOW()
        WHERE id = $12
      `,
      [
        deck.name,
        deck.hero,
        deck.side,
        deck.category,
        deck.archetype,
        deck.creator,
        deck.description,
        deck.image,
        deck.cost,
        deck.aliases,
        deck.modified_at,
        suggestion.id,
      ],
    );

    console.log(
      `[Deck Suggestions] Synced ${isUpdate ? "update proposal" : "suggestion"} #${suggestion.id}.`,
    );
  } catch (error) {
    console.error(
      `[Deck Suggestions] Failed to sync suggestion #${suggestion.id}:`,
      error,
    );
  }
}

async function processCompletedAndDeclinedSuggestions(db, forumChannel) {
  try {
    const result = await db.query(`
      SELECT *
      FROM user_deck_suggestions
      WHERE status IN ('completed', 'declined')
        AND discord_thread_id IS NOT NULL
        AND discord_message_id IS NOT NULL
    `);

    for (const suggestion of result.rows || []) {
      const thread = await forumChannel.threads
        .fetch(suggestion.discord_thread_id)
        .catch(() => null);

      if (!thread) {
        console.error(
          `[Deck Suggestions] Could not fetch thread ${suggestion.discord_thread_id} for ${suggestion.status} suggestion #${suggestion.id}.`,
        );
        continue;
      }

      const message = await thread.messages
        .fetch(suggestion.discord_message_id)
        .catch(() => null);

      if (!message) {
        console.error(
          `[Deck Suggestions] Could not fetch original message ${suggestion.discord_message_id} for suggestion #${suggestion.id}.`,
        );
        continue;
      }

      if (suggestion.status === "completed") {
        if (!message.reactions.cache.has(COMPLETED_EMOJI)) {
          await message.react(COMPLETED_EMOJI);

          console.log(
            `[Deck Suggestions] Added ${COMPLETED_EMOJI} to completed suggestion #${suggestion.id}.`,
          );
        }
      }

      if (suggestion.status === "declined") {
        if (!message.reactions.cache.has(DECLINED_EMOJI)) {
          await message.react(DECLINED_EMOJI);

          console.log(
            `[Deck Suggestions] Added ${DECLINED_EMOJI} to declined suggestion #${suggestion.id}.`,
          );
        }
      }

      if (!thread.locked) {
        await thread.setLocked(true);

        console.log(
          `[Deck Suggestions] Locked ${suggestion.status} suggestion thread ${thread.id} for suggestion #${suggestion.id}.`,
        );
      }

      if (!thread.archived) {
        await thread.setArchived(true);

        console.log(
          `[Deck Suggestions] Archived ${suggestion.status} suggestion thread ${thread.id} for suggestion #${suggestion.id}.`,
        );
      }

      if (!suggestion.discord_thread_url) {
        const discordThreadUrl = `https://discord.com/channels/${thread.guild.id}/${thread.id}`;

        await db.query(
          `
            UPDATE user_deck_suggestions
            SET
              discord_thread_url = $1,
              updated_at = NOW()
            WHERE id = $2
          `,
          [discordThreadUrl, suggestion.id],
        );
      }
    }
  } catch (error) {
    console.error(
      "[Deck Suggestions] Error processing completed/declined suggestions:",
      error,
    );
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
    const isUpdate = suggestion.suggestion_type === "update";

    console.log(
      `[Deck Suggestions] Processing ${
        isUpdate ? "update proposal" : "new suggestion"
      } #${suggestion.id}: ${suggestion.deck_name}`,
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
        `[Deck Suggestions] Hero tag for "${suggestion.hero}" is unavailable on forum ${forumChannel.id}.`,
      );
      return;
    }

    let existingDeck = null;

    if (isUpdate) {
      if (!suggestion.published_deckid) {
        console.error(
          `[Deck Suggestions] Update proposal #${suggestion.id} has no published_deckid.`,
        );
        return;
      }

      const deckResult = await db.query(
        `
          SELECT *
          FROM web_decks
          WHERE deckid = $1
          LIMIT 1
        `,
        [suggestion.published_deckid],
      );

      existingDeck = deckResult.rows?.[0];

      if (!existingDeck) {
        console.error(
          `[Deck Suggestions] Published deck #${suggestion.published_deckid} not found for proposal #${suggestion.id}.`,
        );
        return;
      }
    }

    const thread = await forumChannel.threads.create({
      name: isUpdate
        ? `${existingDeck.name || "Untitled Deck"} needs an update`
        : suggestion.deck_name || "Deck Suggestion",
      appliedTags: validTags,
      message: {
        embeds: [buildSuggestionEmbed(suggestion, existingDeck)],
      },
    });

    const starterMessage = await thread.fetchStarterMessage();

    if (starterMessage) {
      await starterMessage.pin();
      await starterMessage.react(UPVOTE_EMOJI);
      await starterMessage.react(DOWNVOTE_EMOJI);
    }

    if (isUpdate) {
      const previousInfoEmbed = buildDeckEmbedFromRow(
        existingDeck,
        "web_decks",
        dbTableColors,
      );

      const previousInfoMessage = await thread.send({
        embeds: [previousInfoEmbed],
      });

      await previousInfoMessage.pin();
    }

    const discordThreadUrl = `https://discord.com/channels/${thread.guild.id}/${thread.id}`;

    const sourceDeckResult = await db.query(
      `
        SELECT modified_at
        FROM user_decks
        WHERE id = $1
        LIMIT 1
      `,
      [suggestion.deck_id],
    );

    const sourceModifiedAt = sourceDeckResult.rows?.[0]?.modified_at ?? null;

    const updateResult = await db.query(
      `
        UPDATE user_deck_suggestions
        SET
          discord_thread_id = $1,
          discord_message_id = $2,
          discord_thread_url = $3,
          last_synced_deck_modified_at = $4,
          updated_at = NOW()
        WHERE id = $5
      `,
      [
        thread.id,
        starterMessage ? starterMessage.id : null,
        discordThreadUrl,
        sourceModifiedAt,
        suggestion.id,
      ],
    );

    if (updateResult.rowCount !== 1) {
      console.error(
        `[Deck Suggestions] Thread created, but database update affected ${updateResult.rowCount} rows for suggestion #${suggestion.id}.`,
      );
      return;
    }

    console.log(
      `[Deck Suggestions] Created ${
        isUpdate ? "update proposal" : "suggestion"
      } thread ${thread.id} for suggestion #${suggestion.id}.`,
    );
  } catch (error) {
    console.error(
      `[Deck Suggestions] Failed to process suggestion #${suggestion.id}:`,
      error,
    );
  }
}

async function processWebsiteSuggestions(client) {
  try {
    const db = require("../../../index.js");

    const forumChannel = client.channels.cache.get(WEBSITE_SUGGESTION_FORUM_ID);

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

    for (const suggestion of result.rows || []) {
      await processSingleWebsiteSuggestion(db, forumChannel, suggestion);
    }
  } catch (error) {
    console.error("[Website Suggestions] Error processing suggestions:", error);
  }
}

async function processSingleWebsiteSuggestion(db, forumChannel, suggestion) {
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

    const thread = await forumChannel.threads.create({
      name: suggestion.title || "Website Suggestion",
      appliedTags: [validTag.id],
      message: {
        embeds: [buildWebsiteSuggestionEmbed(suggestion)],
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
