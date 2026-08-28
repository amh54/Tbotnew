const {
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

async function handleDeckSuggestionConsent(interaction, db) {
  try {
    const parts = interaction.customId.split("_");

    // decksuggestion_consent_yes_123
    // decksuggestion_consent_no_123
    const action = parts[2];
    const suggestionId = Number(parts[3]);

    if (!Number.isInteger(suggestionId)) {
      return await interaction.reply({
        content: "This consent request is invalid.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = await db.query(
      `
        SELECT *
        FROM user_deck_suggestions
        WHERE id = $1
        LIMIT 1
      `,
      [suggestionId],
    );

    const suggestion = result.rows?.[0];

    if (!suggestion) {
      return await interaction.reply({
        content: "This deck suggestion could not be found.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // SECURITY CHECK:
    // Only the actual deck owner may approve/deny the suggestion.
    if (
      String(interaction.user.id) !==
      String(suggestion.consent_creator_discord_id)
    ) {
      return await interaction.reply({
        content:
          "You are not the creator of this deck, so you cannot approve or decline this suggestion.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Prevent the same suggestion from being processed twice.
    if (suggestion.consent_status !== "awaiting_creator") {
      return await interaction.reply({
        content: "This suggestion has already been processed.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // ============================================================
    // APPROVE
    // ============================================================

    if (action === "yes") {
      await db.query(
        `
          UPDATE user_deck_suggestions
          SET
            consent_status = 'confirmed',
            consent_given_at = NOW()
          WHERE id = $1
        `,
        [suggestionId],
      );

      const embed = new EmbedBuilder()
        .setTitle("Deck Suggestion Approved")
        .setDescription(
          `You approved the suggestion for **${suggestion.deck_name}**.\n\n` +
            "The deck will now be posted to the appropriate deck suggestion forum.",
        )
        .setColor("Green");

      return await interaction.update({
        embeds: [embed],
        components: [],
      });
    }

    // ============================================================
    // DECLINE
    // ============================================================

    if (action === "no") {
      await db.query(
        `
          UPDATE user_deck_suggestions
          SET
            consent_status = 'denied',
            status = 'denied'
          WHERE id = $1
        `,
        [suggestionId],
      );

      const embed = new EmbedBuilder()
        .setTitle("Deck Suggestion Declined")
        .setDescription(
          `You declined the suggestion for **${suggestion.deck_name}**.`,
        )
        .setColor("Red");

      return await interaction.update({
        embeds: [embed],
        components: [],
      });
    }

    // ============================================================
    // INVALID ACTION
    // ============================================================

    return await interaction.reply({
      content: "Invalid consent action.",
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error(
      "[Deck Suggestions] Consent handler error:",
      error,
    );

    const payload = {
      content:
        "Something went wrong while processing this consent request.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(payload);
    }

    return await interaction.reply(payload);
  }
}

module.exports = {
  handleDeckSuggestionConsent,
};