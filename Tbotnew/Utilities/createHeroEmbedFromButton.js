
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function createHeroEmbedFromButton(row) {
  // Map hero names to their command equivalents and deck tables
  const heroCommandMap = {
    "Beta-Carrotina": { command: "helpbc", table: "bcdecks" },
    "Captain Combustible": { command: "helpcc", table: "ccdecks" },
    "Citron": { command: "helpct", table: "ctdecks" },
    "Chompzilla": { command: "helpcz", table: "czdecks" },
    "Grass Knuckles": { command: "helpgk", table: "gkdecks" },
    "Green Shadow": { command: "helpgs", table: "gsdecks" },
    "Night Cap": { command: "helpnc", table: "ncdecks" },
    "Rose": { command: "helpro", table: "rodecks" },
    "Solar Flare": { command: "helpsf", table: "sfdecks" },
    "Spudow": { command: "helpsp", table: "spdecks" },
    "Wall-Knight": { command: "helpwk", table: "wkdecks" },
    "Brain Freeze": { command: "helpbf", table: "bfdecks" },
    "Electric Boogaloo": { command: "helpeb", table: "ebdecks" },
    "Huge-Gigantacus": { command: "helphg", table: "hgdecks" },
    "Super Brainz": { command: "helpsb", table: "sbdecks" },
    "Impfinity": { command: "helpif", table: "ifdecks" },
    "Immorticia": { command: "helpim", table: "imdecks" },
    "Neptuna": { command: "helpnt", table: "ntdecks" },
    "Professor Brainstorm": { command: "helppb", table: "pbdecks" },
    "Rustbolt": { command: "helprb", table: "rbdecks" },
    "The Smash": { command: "helpsm", table: "smdecks" },
    "Z-Mech": { command: "helpzm", table: "zmdecks" }
  };

  const heroInfo = heroCommandMap[row.heroname];
  if (!heroInfo) {
    throw new Error(`Unknown hero: ${row.heroname}`);
  }

  const embed = new EmbedBuilder()
    .setThumbnail(row.thumbnail)
    .setTitle(`${row.title}`)
    .setDescription(`**\\- ${row.description} -**`)
    .setColor(row.deck_color)
    .addFields(
      {
        name: "Superpowers",
        value: row.superpowers,
        inline: true
      },
      {
        name: "Set-Rarity", 
        value: row.set_rarity,
        inline: true
      },
      {
        name: "Flavor Text",
        value: row.flavor_text,
        inline: true
      }
    );

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`herohelp_${heroInfo.command}`) // Use mapped command like "helpgs"
      .setLabel(`${row.heroname} Decks`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(row.hero_emoji)
  );

  return { embed, button };
}

module.exports = createHeroEmbedFromButton;