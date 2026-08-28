const {
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const SUGGESTION_CHECK_INTERVAL = 30 * 1000;

const SUGGESTION_FORUM_ID = "1100160031128830104";

let watcherRunning = false;

const HERO_TAGS = {
  "Captain Combustible": ["1100172143603482786"],
  Chompzilla: ["1100171601045106819"],

  // Beta-Carrotina and Citron use the same forum tag.
  "Beta-Carrotina": ["1100171558263193700"],
  Citron: ["1100171558263193700"],

  "Grass Knuckles": ["1100171819148906628"],
  "Green Shadow": ["1100172254983241820"],
  "Night Cap": ["1100171997167747172"],
  Rose: ["1100171855316406343"],
  "Solar Flare": ["1100171646557491220"],
  Spudow: ["1100171758256013412"],
  "Wall Knight": ["1100171712391295006"],

  "Brain Freeze": ["1100170721994477668"],
  "Electric Boogaloo": ["1100171042380578857"],

  // Super Brainz and Huge-Gigantacus use the same forum tag.
  "Super Brainz": ["1100170925208502282"],
  "Huge Gigantacus": ["1100170925208502282"],

  Impfinity: ["1100170791594762260"],
  Immorticia: ["1100171253790285904"],
  Neptuna: ["1100170647050649620"],
  Rustbolt: ["1100171459785150585"],
  "Professor Brainstorm": ["1100171115504078901"],
  Smash: ["1100171177529446492"],

  // IMPORTANT: this is the actual Z-Mech forum tag ID.
  Zmech: ["1100170981013729410"],
  "Z-Mech": ["1100170981013729410"],
};

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

function normalizeHero(hero) {
  return String(hero || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


async function startDeckSuggestionWatcher(client) {
  if (watcherRunning) {
    console.log("[Deck Suggestions] Watcher already running.");
    return;
  }

  watcherRunning = true;

  console.log("[Deck Suggestions] Watcher started.");

  await processDeckSuggestions(client);

  setInterval(async () => {
    await processDeckSuggestions(client);
  }, SUGGESTION_CHECK_INTERVAL);
}

async function processDeckSuggestions(client) {
  try {
    const db = require("../../../index.js");

    /*
     * ------------------------------------------------------------
     * STEP 1
     * Send consent requests to deck creators.
     *
     * We intentionally DO NOT check consent_request_sent_at here
     * because that column does not currently exist in the database.
     *
     * Once the consent request is sent, consent_status is changed
     * by the consent handler when the creator responds.
     * ------------------------------------------------------------
     */

    const consentResult = await db.query(`
      SELECT *
      FROM user_deck_suggestions
      WHERE status = 'pending'
        AND consent_status = 'awaiting_creator'
      ORDER BY created_at ASC
    `);

    const consentSuggestions = consentResult.rows || [];

    for (const suggestion of consentSuggestions) {
      await sendConsentRequest(client, db, suggestion);
    }

    /*
     * ------------------------------------------------------------
     * STEP 2
     * Find suggestions that have received creator approval.
     * ------------------------------------------------------------
     */

    const result = await db.query(`
      SELECT *
      FROM user_deck_suggestions
      WHERE status = 'pending'
        AND consent_status = 'confirmed'
        AND discord_thread_id IS NULL
      ORDER BY created_at ASC
    `);

    const suggestions = result.rows || [];

    if (!suggestions.length) {
      return;
    }

    console.log(
      `[Deck Suggestions] Found ${suggestions.length} approved suggestion(s).`,
    );

    /*
     * ------------------------------------------------------------
     * STEP 3
     * Get the Discord forum channel.
     * ------------------------------------------------------------
     */

    const forumChannel = client.channels.cache.get(SUGGESTION_FORUM_ID);

    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      console.error("[Deck Suggestions] Forum channel not found or invalid.");

      return;
    }

    /*
     * Optional diagnostic output.
     *
     * This lets you verify that the configured hero tag IDs
     * actually exist on the forum.
     */
    console.log(
      "[Deck Suggestions] Available forum tags:",
      forumChannel.availableTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
    );

    /*
     * ------------------------------------------------------------
     * STEP 4
     * Create each approved forum post.
     * ------------------------------------------------------------
     */

    for (const suggestion of suggestions) {
      await processSingleSuggestion(db, forumChannel, suggestion);
    }
  } catch (error) {
    console.error("[Deck Suggestions] Error processing suggestions:", error);
  }
}

async function sendConsentRequest(client, db, suggestion) {
  try {
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

    /*
     * NOTE:
     * Your current database does not have consent_request_sent_at.
     *
     * We therefore do not update that column here.
     *
     * The important state is consent_status.
     *
     * If you want a persistent "request already sent" flag,
     * add a column for it later.
     */

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
      .setTitle(`${suggestion.deck_name}`)
      .setDescription(
        suggestion.description || "No description provided.",
      )
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

    /*
     * ------------------------------------------------------------
     * GET HERO FORUM TAG
     * ------------------------------------------------------------
     */

    const appliedTags = getHeroTags(suggestion.hero);

    if (!appliedTags.length) {
      console.error(
        `[Deck Suggestions] No forum tag configured for hero "${suggestion.hero}" on suggestion #${suggestion.id}.`,
      );
      return;
    }

    const availableTags = forumChannel.availableTags || [];

    const validTags = appliedTags.filter((tagId) =>
      availableTags.some(
        (tag) => String(tag.id) === String(tagId),
      ),
    );

    if (!validTags.length) {
      console.error(
        `[Deck Suggestions] Configured hero tag for "${suggestion.hero}" does not exist on forum channel ${forumChannel.id}.`,
      );

      console.error(
        "[Deck Suggestions] Configured tag IDs:",
        appliedTags,
      );

      console.error(
        "[Deck Suggestions] Available tag IDs:",
        availableTags.map((tag) => tag.id),
      );

      return;
    }

    /*
     * ------------------------------------------------------------
     * CREATE FORUM POST
     * ------------------------------------------------------------
     */

    const thread = await forumChannel.threads.create({
      name: `${suggestion.deck_name} - Suggested`,
      autoArchiveDuration: 10080,
      appliedTags: validTags,

      message: {
        embeds: [embed],
      },
    });

    /*
     * ------------------------------------------------------------
     * PIN + VOTING EMOJIS
     * ------------------------------------------------------------
     */

    const starterMessage =
      await thread.fetchStarterMessage();

    if (starterMessage) {
      await starterMessage.pin();

      await starterMessage.react(
        "<:upvote:1081953853903220876>",
      );

      await starterMessage.react(
        "<:downvote:1081953860534403102>",
      );
    }

    /*
     * ------------------------------------------------------------
     * SAVE DISCORD THREAD ID
     * ------------------------------------------------------------
     */

    await db.query(
      `
        UPDATE user_deck_suggestions
        SET discord_thread_id = $1
        WHERE id = $2
      `,
      [thread.id, suggestion.id],
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

module.exports = {
  startDeckSuggestionWatcher,
};
