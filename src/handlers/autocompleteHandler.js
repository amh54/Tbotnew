const isUnknownInteractionError = (error) =>
  error?.code === 10062 || error?.rawError?.code === 10062;

async function handleAutocomplete(interaction) {
  const command = interaction.client.slashCommands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    if (isUnknownInteractionError(error)) {
      return;
    }

    console.error(error);
  }
}

module.exports = { handleAutocomplete };
