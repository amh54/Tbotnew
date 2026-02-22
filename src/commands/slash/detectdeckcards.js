const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { detectDeckCardsFromImage } = require("../../features/cards/detectDeckCardsFromImage");

const DETECTION_TIMEOUT_MS = 45000;

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Detection timed out"));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("detectdeckcards")
    .setDescription("Detect cards from a PvZ Heroes deck image")
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("Deck screenshot image")
        .setRequired(true)
    ),

  async execute(interaction) {
    const image = interaction.options.getAttachment("image");
    const imageUrl = image?.url;

    if (!imageUrl || !image?.contentType?.startsWith("image/")) {
      return interaction.reply({
        content: "❌ Please upload a valid image attachment.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    const db = require("../../../index.js");
    let result;
    try {
      result = await withTimeout(detectDeckCardsFromImage(db, imageUrl), DETECTION_TIMEOUT_MS);
    } catch (error) {
      console.error("[detectdeckcards] Detection failed or timed out:", error);
      return interaction.editReply({
        content: "⚠️ Card detection took too long or failed. Please try again with a smaller/clearer image.",
      });
    }

    if (!result.cards.length) {
      return interaction.editReply({
        content:
          "⚠️ I couldn't confidently match any cards from this image yet. This can happen if reference card image URLs are expired or the screenshot is unclear.",
      });
    }

    const maxCardsToShow = 40;
    const shown = result.cards.slice(0, maxCardsToShow);
    const cardsText = shown.map((name, idx) => `${idx + 1}. ${name}`).join("\n");
    const clipped = result.cards.length > shown.length ? `\n...and ${result.cards.length - shown.length} more` : "";

    return interaction.editReply({
      content:
        `✅ Detected **${result.cards.length}** card(s) from image.\n` +
        `Mode: **${result.mode}** | Matched Slots: **${result.matchedSlots}/${result.totalSlotsScanned}**\n\n` +
        cardsText +
        clipped,
    });
  },
};
