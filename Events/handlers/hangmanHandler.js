const { EmbedBuilder, MessageFlags } = require("discord.js");
const { ascii, hangmanGuesses } = require("../../Utilities/hangman");

async function handleHangmanModal(interaction) {
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

  if (guess.length > 1) {
    return await handleWordGuess(interaction, game, guess);
  }

  return await handleLetterGuess(interaction, game, guess);
}

async function handleWordGuess(interaction, game, guess) {
  if (guess === game.word) {
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
    .setDescription(`\`\`\`${ascii[game.guesses + 1]}${game.text}\n\`\`\``)
    .setFields(fields);

  await interaction.message.edit({ embeds: [embed] });

  hangmanGuesses.set(interaction.message.id, {
    ...game,
    guesses: game.guesses + 1,
    words: [...game.words, guess],
  });
}

async function handleLetterGuess(interaction, game, guess) {
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

  if (game.guesses === 6) {
    const gameOverEmbed = new EmbedBuilder()
      .setTitle("Hangman - Game Over")
      .setColor("Red")
      .setDescription(
        `Nobody won this game! \n The correct word was: \`${game.word}\``
      );
    return interaction.message.edit({
      embeds: [gameOverEmbed],
      components: [],
    });
  }

  hangmanGuesses.set(interaction.message.id, {
    word: game.word,
    unguessed: game.unguessed,
    guesses: game.word.includes(guess) ? game.guesses : game.guesses + 1,
    letters: [...game.letters, guess].sort((a, b) => a.localeCompare(b)),
    words: game.words,
    text: [...game.word].map((c) => (game.unguessed.has(c) ? "_" : c)).join(" "),
  });
}

module.exports = { handleHangmanModal };
