const { SlashCommandBuilder } = require("discord.js");
const { runHelpDb } = require("../../features/help/helpdb.js");

const helpDbChoices = [
  { name: "Budget Plant Decks", value: "plant_budget" },
  { name: "Competitive Plant Decks", value: "plant_comp" },
  { name: "Ladder Plant Decks", value: "plant_ladder" },
  { name: "Meme Plant Decks", value: "plant_meme" },
  { name: "Aggro Plant Decks", value: "plant_aggro" },
  { name: "Combo Plant Decks", value: "plant_combo" },
  { name: "Control Plant Decks", value: "plant_control" },
  { name: "Midrange Plant Decks", value: "plant_midrange" },
  { name: "Tempo Plant Decks", value: "plant_tempo" },
  { name: "All Plant Decks", value: "plant_all" },
  { name: "Budget Zombie Decks", value: "zombie_budget" },
  { name: "Competitive Zombie Decks", value: "zombie_comp" },
  { name: "Ladder Zombie Decks", value: "zombie_ladder" },
  { name: "Meme Zombie Decks", value: "zombie_meme" },
  { name: "Aggro Zombie Decks", value: "zombie_aggro" },
  { name: "Combo Zombie Decks", value: "zombie_combo" },
  { name: "Control Zombie Decks", value: "zombie_control" },
  { name: "Midrange Zombie Decks", value: "zombie_midrange" },
  { name: "Tempo Zombie Decks", value: "zombie_tempo" },
  { name: "All Zombie Decks", value: "zombie_all" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("helpdb")
    .setDescription("Browse all decks in the database")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Select a deck category")
        .setRequired(true)
        .addChoices(...helpDbChoices)
    ),
  async execute(interaction) {
    const selectedType = interaction.options.getString("type");
    return runHelpDb(interaction, selectedType);
  }
};
