const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const heroes = {
  plantheroes: [
    "Green Shadow",
    "Wallknkight",
    "Spudow",
    "Grass Knuckles",
    "Rose",
    "Beta Carrotina",
    "Solar Flare",
    "Chompzilla",
    "Citron",
    "Night Cap",
    "Captain Combustible"
  ],
  zombieheroes: [
    "Super Brainz",
    "impfinity",
    "Electric Boogaloo",
    "Professor Brainstorm",
    "Zmech",
    "Huge Giganticus",
    "The Smash",
    "Rustbolt",
    "Brain Freeze",
    "Immorticia",
    "Neptuna"
  ]
};

const getRandomHero = (list) => list[Math.floor(Math.random() * list.length)];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("herowheel")
    .setDescription("Get a random plant or zombie hero")
    .addStringOption((option) =>
      option
        .setName("side")
        .setDescription("Choose plants or zombies")
        .setRequired(true)
        .addChoices(
          { name: "Plants", value: "plants" },
          { name: "Zombies", value: "zombies" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("exclude_hero_1")
        .setDescription("First hero to exclude from the wheel")
        .setRequired(false)
        .addChoices(
          ...heroes.plantheroes.map(h => ({ name: h, value: h })),
          ...heroes.zombieheroes.map(h => ({ name: h, value: h }))
        )
    )
    .addStringOption((option) =>
      option
        .setName("exclude_hero_2")
        .setDescription("Second hero to exclude from the wheel")
        .setRequired(false)
        .addChoices(
          ...heroes.plantheroes.map(h => ({ name: h, value: h })),
          ...heroes.zombieheroes.map(h => ({ name: h, value: h }))
        )
    )
    .addStringOption((option) =>
      option
        .setName("exclude_hero_3")
        .setDescription("Third hero to exclude from the wheel")
        .setRequired(false)
        .addChoices(
          ...heroes.plantheroes.map(h => ({ name: h, value: h })),
          ...heroes.zombieheroes.map(h => ({ name: h, value: h }))
        )
    )
    .addStringOption((option) =>
      option
        .setName("exclude_hero_4")
        .setDescription("Fourth hero to exclude from the wheel")
        .setRequired(false)
        .addChoices(
          ...heroes.plantheroes.map(h => ({ name: h, value: h })),
          ...heroes.zombieheroes.map(h => ({ name: h, value: h }))
        )
    ),
  async execute(interaction) {
    const side = interaction.options.getString("side");
    const isPlants = side === "plants";
    const heroList = isPlants ? heroes.plantheroes : heroes.zombieheroes;
    
    // Collect excluded heroes
    const excludedHeroes = new Set();
    for (let i = 1; i <= 4; i++) {
      const excluded = interaction.options.getString(`exclude_hero_${i}`);
      if (excluded) {
        excludedHeroes.add(excluded);
      }
    }
    
    // Filter out excluded heroes
    const availableHeroes = heroList.filter(hero => !excludedHeroes.has(hero));
    
    if (availableHeroes.length === 0) {
      return interaction.reply({
        content: "No heroes available after excluding all options!",
        flags: MessageFlags.Ephemeral
      });
    }
    
    const randomHero = getRandomHero(availableHeroes);

    return interaction.reply({
      content: `Hello ${interaction.user.username}, you got **${randomHero}** as your random ${
        isPlants ? "plant" : "zombie"
      } hero!`
    });
  }
};
