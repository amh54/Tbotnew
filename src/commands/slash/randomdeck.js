const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");
const buildDeckFooter = require("../../features/decks/buildDeckFooter.js");

const HERO_CHOICES = [
  { name: "Beta-Carrotina", value: "Beta-Carrotina" },
  { name: "Captain Combustible", value: "Captain Combustible" },
  { name: "Chompzilla", value: "Chompzilla" },
  { name: "Citron", value: "Citron" },
  { name: "Grass Knuckles", value: "Grass Knuckles" },
  { name: "Green Shadow", value: "Green Shadow" },
  { name: "Night Cap", value: "Night Cap" },
  { name: "Rose", value: "Rose" },
  { name: "Solar Flare", value: "Solar Flare" },
  { name: "Spudow", value: "Spudow" },
  { name: "Wall-Knight", value: "Wall-Knight" },
  { name: "Brain Freeze", value: "Brain Freeze" },
  { name: "Electric Boogaloo", value: "Electric Boogaloo" },
  { name: "Huge-Gigantacus", value: "Huge-Gigantus" },
  { name: "Super Brainz", value: "Super Brainz" },
  { name: "Impfinity", value: "Impfinity" },
  { name: "Immorticia", value: "Immorticia" },
  { name: "Neptuna", value: "Neptuna" },
  { name: "Professor Brainstorm", value: "Professor Brainstorm" },
  { name: "Rustbolt", value: "Rustbolt" },
  { name: "The Smash", value: "The Smash" },
  { name: "Z-Mech", value: "Z-Mech" }
];
module.exports = {
  data: new SlashCommandBuilder()
    .setName("randomdeck")
    .setDescription("Get a random deck from the Tbot database")
    .addStringOption((option) =>
      option
        .setName("hero")
        .setDescription("The hero or side to get a random deck from")
        .addChoices(
          ...HERO_CHOICES.map((choice) => choice),
          { name: "Plants", value: "Plants" },
          { name: "Zombies", value: "Zombies" },
          { name: "Any", value: "na" }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const db = require("../../../index.js");
    const heroInput = interaction.options.getString("hero");

    try {
      const heroChoice = HERO_CHOICES.find((choice) => choice.value === heroInput);
      let where = "COALESCE(category, '') NOT LIKE ?";
      const params = ["%budget%"];

      if (heroInput === "Plants" || heroInput === "Zombies") {
        where += " AND LOWER(side) = LOWER(?)";
        params.push(heroInput);
      } else if (heroInput !== "na") {
        const heroName = heroChoice?.value || heroInput;
        where += " AND LOWER(hero) = LOWER(?)";
        params.push(heroName);
      }

      const [rows] = await db.query(
        `SELECT * FROM tbot_decks WHERE ${where}`,
        params
      );

      if (!rows?.length) {
        return interaction.reply({
          content: "Oops, something went wrong or no decks were found. Please try again later.",
          flags: MessageFlags.Ephemeral
        });
      }

      const randomRow = rows[Math.floor(Math.random() * rows.length)];
      const embed = new EmbedBuilder()
        .setTitle(randomRow.name || "Unknown")
        .setDescription(randomRow.description || "")
        .setColor("Random")
        .addFields(
          { name: "Category", value: `**__${randomRow.category || randomRow.type || "N/A"}__**`, inline: true },
          { name: "Archetype", value: `**__${randomRow.archetype || "N/A"}__**`, inline: true },
          { name: "Deck Cost", value: randomRow.cost ? `${randomRow.cost}<:spar:1057791557387956274>` : "**__N/A__**", inline: true }
        );

      const footer = buildDeckFooter(randomRow);
      if (footer) embed.setFooter({ text: footer });

      if (randomRow.image?.startsWith("http")) {
        embed.setImage(randomRow.image);
      }

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "Oops, something went wrong or no decks were found. Please try again later.",
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
