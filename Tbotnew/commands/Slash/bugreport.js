const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
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
      const db = require("../../index.js");
      const focusedValue = interaction.options.getFocused();
      
      // Use a single optimized query to get all deck names at once
      const deckQuery = `
        SELECT name FROM gsdecks UNION ALL
        SELECT name FROM sfdecks UNION ALL
        SELECT name FROM wkdecks UNION ALL
        SELECT name FROM czdecks UNION ALL
        SELECT name FROM spdecks UNION ALL
        SELECT name FROM ctdecks UNION ALL
        SELECT name FROM gkdecks UNION ALL
        SELECT name FROM ncdecks UNION ALL
        SELECT name FROM rodecks UNION ALL
        SELECT name FROM ccdecks UNION ALL
        SELECT name FROM bcdecks UNION ALL
        SELECT name FROM sbdecks UNION ALL
        SELECT name FROM smdecks UNION ALL
        SELECT name FROM ifdecks UNION ALL
        SELECT name FROM rbdecks UNION ALL
        SELECT name FROM ebdecks UNION ALL
        SELECT name FROM bfdecks UNION ALL
        SELECT name FROM pbdecks UNION ALL
        SELECT name FROM imdecks UNION ALL
        SELECT name FROM zmdecks UNION ALL
        SELECT name FROM ntdecks UNION ALL
        SELECT name FROM hgdecks
      `;
      
      // Execute queries in parallel for speed
      const [deckResults, cardResults, builderResults] = await Promise.all([
        db.query(deckQuery),
        db.query(`
          SELECT card_name as name FROM guardiancards UNION ALL
          SELECT card_name as name FROM guardiantricks UNION ALL
          SELECT card_name as name FROM kabloomcards UNION ALL
          SELECT card_name as name FROM kabloomtricks UNION ALL
          SELECT card_name as name FROM megagrowcards UNION ALL
          SELECT card_name as name FROM megagrowtricks UNION ALL
          SELECT card_name as name FROM smartycards UNION ALL
          SELECT card_name as name FROM smartytricks UNION ALL
          SELECT card_name as name FROM solarcards UNION ALL
          SELECT card_name as name FROM solartricks UNION ALL
          SELECT card_name as name FROM beastlycards UNION ALL
          SELECT card_name as name FROM beastlytricks UNION ALL
          SELECT card_name as name FROM brainycards UNION ALL
          SELECT card_name as name FROM brainytricks UNION ALL
          SELECT card_name as name FROM crazycards UNION ALL
          SELECT card_name as name FROM crazytricks UNION ALL
          SELECT card_name as name FROM heartycards UNION ALL
          SELECT card_name as name FROM heartytricks UNION ALL
          SELECT card_name as name FROM sneakycards UNION ALL
          SELECT card_name as name FROM sneakytricks
        `),
        db.query(`SELECT deckbuilder_name as name FROM deckbuilders`)
      ]);
      
      // Extract all names quickly
      const allNames = [
        ...deckResults[0].map(row => row.name),
        ...cardResults[0].map(row => row.name),
        ...builderResults[0].map(row => row.name)
      ];
      
      // Add client commands
      const clientCommands = Array.from(interaction.client.commands.values())
        .filter(cmd => cmd.category === "Miscellaneous")
        .map(cmd => cmd.name);
      allNames.push(...clientCommands);
      
      // Normalize and deduplicate
      const choices = [...new Set(allNames.map(name => 
        name.toLowerCase().replaceAll(/\s+/g, "")
      ))].sort((a, b) => a.localeCompare(b));
      
      // Filter based on user input
      let filtered;
      if (focusedValue) {
        const searchTerm = focusedValue.toLowerCase().replaceAll(/\s+/g, "");
        filtered = choices
          .filter(choice => choice.startsWith(searchTerm))
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
          const db = require("../../index.js");
          
          // Use the same optimized queries as autocomplete
          const deckQuery = `
            SELECT name FROM gsdecks UNION ALL
            SELECT name FROM sfdecks UNION ALL
            SELECT name FROM wkdecks UNION ALL
            SELECT name FROM czdecks UNION ALL
            SELECT name FROM spdecks UNION ALL
            SELECT name FROM ctdecks UNION ALL
            SELECT name FROM gkdecks UNION ALL
            SELECT name FROM ncdecks UNION ALL
            SELECT name FROM rodecks UNION ALL
            SELECT name FROM ccdecks UNION ALL
            SELECT name FROM bcdecks UNION ALL
            SELECT name FROM sbdecks UNION ALL
            SELECT name FROM smdecks UNION ALL
            SELECT name FROM ifdecks UNION ALL
            SELECT name FROM rbdecks UNION ALL
            SELECT name FROM ebdecks UNION ALL
            SELECT name FROM bfdecks UNION ALL
            SELECT name FROM pbdecks UNION ALL
            SELECT name FROM imdecks UNION ALL
            SELECT name FROM zmdecks UNION ALL
            SELECT name FROM ntdecks UNION ALL
            SELECT name FROM hgdecks
          `;
          
          // Execute queries in parallel for speed
          const [deckResults, cardResults, builderResults] = await Promise.all([
            db.query(deckQuery),
            db.query(`
              SELECT card_name as name FROM guardiancards UNION ALL
              SELECT card_name as name FROM guardiantricks UNION ALL
              SELECT card_name as name FROM kabloomcards UNION ALL
              SELECT card_name as name FROM kabloomtricks UNION ALL
              SELECT card_name as name FROM megagrowcards UNION ALL
              SELECT card_name as name FROM megagrowtricks UNION ALL
              SELECT card_name as name FROM smartycards UNION ALL
              SELECT card_name as name FROM smartytricks UNION ALL
              SELECT card_name as name FROM solarcards UNION ALL
              SELECT card_name as name FROM solartricks UNION ALL
              SELECT card_name as name FROM beastlycards UNION ALL
              SELECT card_name as name FROM beastlytricks UNION ALL
              SELECT card_name as name FROM brainycards UNION ALL
              SELECT card_name as name FROM brainytricks UNION ALL
              SELECT card_name as name FROM crazycards UNION ALL
              SELECT card_name as name FROM crazytricks UNION ALL
              SELECT card_name as name FROM heartycards UNION ALL
              SELECT card_name as name FROM heartytricks UNION ALL
              SELECT card_name as name FROM sneakycards UNION ALL
              SELECT card_name as name FROM sneakytricks
            `),
            db.query(`SELECT deckbuilder_name as name FROM deckbuilders`)
          ]);
          
          // Extract all names quickly
          const allNames = [
            ...deckResults[0].map(row => row.name),
            ...cardResults[0].map(row => row.name),
            ...builderResults[0].map(row => row.name)
          ];
          
          // Add client commands
          const clientCommands = Array.from(interaction.client.commands.values())
            .filter(cmd => cmd.category === "Miscellaneous")
            .map(cmd => cmd.name);
          allNames.push(...clientCommands);
          
          // Normalize names
          const normalizedNames = allNames.map(name => name.toLowerCase().replaceAll(/\s+/g, ""));
          
          const commandName = interaction.options.getString('command_name');
          const bugDescription = interaction.options.getString('bug_description');
          const owner = await interaction.client.users.fetch("625172218120372225");
          
          if (normalizedNames.includes(commandName.toLowerCase().replaceAll(/\s+/g, ""))) {
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


        try{
            await owner.send({
                embeds: [embed],
            });
        } catch (error) {
            console.error('Error sending bug report:', error);
            await interaction.reply({ content: 'There was an error sending your bug report.', flags: MessageFlags.Ephemeral });
            return;
        }

            await interaction.editReply({ content: 'Thank you for your bug report! It has been reported to Tbone, who is the owner of Tbot' });
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