const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
  } = require('discord.js');
  module.exports = {
    name: `herowheel`,
    category: `Miscellaneous`,
    run: async (client, message, args) => {
      if(message.guild && message.guild.id == "285818469960646657"){
        return message.author.send("This command is disabled in this server please use it in another server");
      }
      else{
      const row= new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('plants')
          .setLabel('Random Plant Hero')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('<:200w:1260951571840237628>'),
        new ButtonBuilder()
          .setCustomId('zombies')
          .setLabel('Random Zombie Hero')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('<:200w:1260951571840237628>')
      )
        const search = new EmbedBuilder()
        .setTitle("Hero Wheel")
        .setDescription("Please use the button below to spin the wheel and get a random hero")
        .setColor("Random")
        await message.reply({embeds: [search], components: [row]})
    }
    const filter = i => i.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter});
    collector.on('collect', async i => {
      const heroes = {
        plantheroes: ["Green Shadow", "Wallknkight", "Spudow", "Grass Knuckles", "Rose", "Beta Carrotina", "Solar Flare", "Chompzilla", 
          "Citron", "Night Cap", "Captain Combustible"
        ], 
        zombieheroes: ["Super Brainz", "impfinity", "Electric Boogaloo", "Professor Brainstorm", "Zmech", "Huge Giganticus",
          "The Smash", "Rustbolt", "Brain Freeze", "Immorticia", "Neptuna"
        ]
      }
      if(i.customId == 'plants'){
        const randomHero = heroes.plantheroes[Math.floor(Math.random() * heroes.plantheroes.length)];
        await i.reply({content: `Hello ${i.user.username}, you got **${randomHero}** as your random plant hero!`});
      }
      else if(i.customId == 'zombies'){
        const randomHero = heroes.zombieheroes[Math.floor(Math.random() * heroes.zombieheroes.length)];
        await i.reply({content: `Hello ${i.user.username}, you got **${randomHero}** as your random zombie hero!`});
      }
    })
  }
  }