const { MessageFlags } = require("discord.js");

async function handleSlashCommand(interaction) {
  const client = interaction.client;
  const command = client.slashCommands.get(interaction.commandName);
  
  console.log("Received command:", interaction.commandName, "Loaded:", !!command);
  
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error executing command:", interaction.commandName, error);
    
    const errorMessage = {
      content: 'There was an error while executing this command!',
      flags: MessageFlags.Ephemeral
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

module.exports = { handleSlashCommand };
