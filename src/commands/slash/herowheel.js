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
    ),
  async execute(interaction) {
    const side = interaction.options.getString("side");
    const isPlants = side === "plants";
    const randomHero = isPlants
      ? getRandomHero(heroes.plantheroes)
      : getRandomHero(heroes.zombieheroes);

    return interaction.reply({
      content: `Hello ${interaction.user.username}, you got **${randomHero}** as your random ${
        isPlants ? "plant" : "zombie"
      } hero!`,
      flags: MessageFlags.Ephemeral
    });
  }
};
