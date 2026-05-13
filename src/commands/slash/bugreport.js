const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const BUG_REPORT_THREAD_ID = "1503900903605010432";
module.exports = {  
    data: new SlashCommandBuilder()
        .setName('bugreport')
        .setDescription('Report a bug in Tbot')
        .addStringOption(option =>
            option.setName('command_name')
                .setDescription('The name of the command where you found the bug')
                .setRequired(true)
                .setAutocomplete(true)
              )
        .addStringOption(option =>
            option.setName('bug_description')
                .setDescription('A detailed description of the bug')
                .setRequired(true)),
   async autocomplete(interaction) {
  try {
    const focusedValue = interaction.options.getFocused();

    const fetched = await interaction.client.application.commands.fetch();
    const slashNames = Array.from(fetched.values())
      .map(cmd => cmd?.name)
      .filter(Boolean);

    const choices = [...new Set(slashNames)]
      .sort((a, b) => a.localeCompare(b));

    let filtered;
    if (focusedValue) {
      const searchTerm = focusedValue.toLowerCase().replaceAll(/\s+/g, "");
      filtered = choices
        .filter(choice => choice.toLowerCase().replaceAll(/\s+/g, "").startsWith(searchTerm))
        .slice(0, 25);
    } else {
      filtered = choices.slice(0, 25);
    }
    
    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice }))
    );
  } catch (err) {
    console.error("Autocomplete error:", err);
    await interaction.respond([]);
  }
},
async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      const fetched = await interaction.client.application.commands.fetch();
      const slashNames = Array.from(fetched.values())
        .map(cmd => cmd?.name)
        .filter(Boolean);

      const commandName = interaction.options.getString('command_name');
      const bugDescription = interaction.options.getString('bug_description');
      const bugReportThread = await interaction.client.channels.fetch(BUG_REPORT_THREAD_ID).catch(() => null);
          
          if (slashNames.includes(commandName)) {
        const embed = new EmbedBuilder()
          .setTitle(`Bug Report on the command: ${commandName}`)
          .setColor("Random")
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.avatarURL({
              dynamic: true,
            }),
          })
          .setDescription(bugDescription);

            try {
              if (!bugReportThread) {
                throw new Error(`Unable to fetch bug report thread: ${BUG_REPORT_THREAD_ID}`);
              }

              await bugReportThread.send({
                    embeds: [embed],
                });
            } catch (error) {
                console.error('Error sending bug report:', error);
              await interaction.editReply({ content: 'There was an error sending your bug report.' });
                return;
            }
    
              await interaction.editReply({ content: 'Thank you for your bug report! It has been sent to the bug report thread.' });
              } else {
                await interaction.editReply({ content: 'The command name you provided does not exist. Please check the name and try again.' });
              }
            } catch (error) {
              console.error('Error in bug report execute:', error);
              try {
                await interaction.editReply({ content: 'There was an error processing your bug report. Please try again later.' });
              } catch (editError) {
                console.error('Error editing reply:', editError);
              }
            }
        }
    }