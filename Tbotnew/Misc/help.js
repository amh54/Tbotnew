const {
    EmbedBuilder, 
    ActionRowBuilder,
    StringSelectMenuBuilder,
      ComponentType, 
      MessageFlags
  } = require("discord.js")
  module.exports = {
      name: "help",
      description: "Help command",
      aliases: ["helpcommand", "commands", "cmds", "names"],
      category: "Miscellaneous",
      run: async (client, message, args) => {
    const plantHeroes = ["Green Shadow(GS)", "Solar Flare(SF)", "Wall Knight(WK)", "Spudow(SP)", "Rose(RO)", "Captain Combustible(CC)", "Grass Knuckles(GK)", "Beta-Carrotina/Citron", "Chompzilla(CZ)", "Night Cap(NC)"];
    const zombieHeroes = ["Brain Freeze(BF)", "Electric Boogaloo(EB)", "Huge-Gigantacus/SuperBrainz", "Impfinity(IF)", "Immorticia(IM)", "Neptuna(NT)", "Professor Brainstorm(PB)", "Rustbolt(RB)", "Smash(SM)", "Zmech(ZM)"];
    const otherCategories = ["Miscellaneous", "Plant Cards", "Zombie Cards", "Tricks Phase", "DeckBuilders"];
    plantHeroes.sort((a, b) => a.localeCompare(b));
    zombieHeroes.sort((a, b) => a.localeCompare(b));
    otherCategories.sort((a, b) => a.localeCompare(b));
    const orderedCategories = [...plantHeroes, ...zombieHeroes, ...otherCategories,  ];
      const commands = Array.from(client.commands.values())
      const categories = commands.reduce((acc, command) => {
          if (!acc[command.category]) {
              acc[command.category] = [];
          }
          acc[command.category].push(command);
          return acc;
      }, {});     
      const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Select category")
          .setDescription(
              'Please select a category from the select menu given below to view the commands. \n prefix is <@1043528908148052089>'
          )
          .setImage("https://media.discordapp.net/attachments/1044626284346605588/1257720785129312306/all_characters.jpg?ex=66856f42&is=66841dc2&hm=121286e871f2f84b7db1cc561a509a729596e8105b623225d85f3d36cd9b5b43&=&format=webp&width=707&height=614")
          .setFooter({text: `Total Commands: ${commands.length} commands`})
      const cat = orderedCategories
  .filter(category => categories[category])
  .map(category => {
    return {
      label: category,
      value: 'help_' + category,
    }
  })
  
    const menu = new ActionRowBuilder().addComponents(
         new StringSelectMenuBuilder()
              .setCustomId("help_" + message.author.id)
              .setPlaceholder(
                  "Nothing selected"
              )
              .setOptions(cat)
      )
  
      try {
      
          const msg = await message.reply({
              embeds: [embed],
              components: [menu],
          })
                  const iFilter = i => i.user.id === message.author.id
          const collector = msg.createMessageComponentCollector({
             componentType: ComponentType.StringSelectMenuBuilder, filter: iFilter,
          })
          collector.on('collect', async m  => {
                          if(m.customId == "help_" + message.author.id){
              
           //   console.log(client.slashcommands.values())
  
              const category = m.values[0].split("_")[1];
              const Ccommands = Array.from(client.commands.values())
                const commands = Ccommands
                .filter((command) => command.category === category)
                .sort((a, b) => a.name.localeCompare(b.name));
             const embed = new EmbedBuilder()
                  .setColor("Random")
                  .setTitle("Help | " + category)

              let toBuildString = "";
for (const command of commands) {
    const newLine = `**${command.name}** \n`;
    // Check if adding this line would exceed the limit
    if (toBuildString.length + newLine.length > 4000) {
        toBuildString += `\n... and ${commands.length - commands.indexOf(command)} more commands`;
        break;
    }
    toBuildString += newLine;
}
embed.setDescription(toBuildString);
              embed.setDescription(toBuildString)
              embed.setFooter({text: `${category} has ${commands.length} commands and ${commands.length - 1 } decks`})
              if(category == "Miscellaneous" ){
                embed.setDescription(toBuildString + `</randomdeck:1400497035043406007> 
to get a random deck 
</submitdeck:1394802186659168446> 
to submit a deck to Tbot Suggestions 
</8ball:1400510403888549998> 
to ask Tbot a question
</bugreport:1400182844000702577> 
Report a bug to Tbone
</updatedeck:1394802186659168447> 
Update a deck already in Tbot
</wheel:1400489180521304194> 
generates a deck for you by picking random cards for a random hero`) 
                embed.setFooter({text: `${category} has ${commands.length} commands and 6 slash commands`})
              }
              await m.deferUpdate()
            if (category == "Zombie Cards"|| category == "Tricks Phase" || category == "DeckBuilders" || category == "Plant Cards"){
                embed.setFooter({text: `${category} has ${commands.length} commands`})
            }
              await m.message.edit({
                  embeds: [embed],
              })
                          }
                          else{
                  return m.update({
                      content: "You are not the owner of this help menu.",
                      flags: MessageFlags.Ephemeral,
                  })
                          }
          });
      } catch (e) {
          return console.log(e);
      } 
  }
  } 