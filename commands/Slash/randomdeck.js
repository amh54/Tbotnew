const {EmbedBuilder, SlashCommandBuilder, MessageFlags} = require('discord.js');
let db;
module.exports = {
  data: new SlashCommandBuilder()
    .setName('randomdeck')
    .setDescription('Get a random deck from the Tbot database')
    .addStringOption( option => option.setName('hero').setDescription('The hero of the wheel deck').addChoices(
        {name: "Beta Carrotina", value: "Beta Carrotina"},
        { name: "Captain Combustible", value: "Captain Combustible"},
        { name: "Chompzilla", value: "Chompzilla"}, 
        { name: "Citron", value: "Citron"}, 
        {name: "Grass Knuckles", value: "Grass Knuckles"}, 
        {name: "Green Shadow", value: "Green Shadow"},
        {name: "Night Cap", value: "Night Cap"},
        {name: "Rose", value: "Rose"},
        {name: "Solar Flare", value: "Solar Flare"},
        {name: "Spudow", value: "Spudow"}, 
        {name: "Wall Knight", value: "Wall Knight"}, 
        {name: "Brain Freeze", value: "Brain Freeze"}, 
        {name: "Electric Boogaloo", value: "Electric Boogaloo"},
        {name: "Huge Giganticus", value: "Huge Giganticus"},
        {name: "Super Brainz", value: "Super Brainz"},
        {name: "Impfinity", value: "Impfinity"}, 
        {name: "Immorticia", value: "Immorticia"}, 
        {name: "Neptuna", value: "Neptuna"}, 
        {name: "Rustbolt", value: "Rustbolt"}, 
        {name: "Professor Brainstorm", value: "Professor Brainstorm"}, 
        {name: "Smash", value: "Smash"}, 
        {name: "Zmech", value: "Zmech"},
        {name: "Plants", value: "Plants"},
        {name: "Zombies", value: "Zombies"}, 
        {name: "na", value: "na"}
      ).setRequired(true)),
  async execute(interaction) {
    if (!db) {
      db = require("../../index.js");
    }
    const heroInput = interaction.options.getString('hero');

    // Helper function to get a deck and reply, avoiding repeated code
    const getAndSendRandomDeck = async (query) => {
      try {
        const [result] = await db.query(query);

        if (!result || result.length === 0 || !result[0]) {
          throw new Error("No decks found in the database for this category.");
        }
        const randomRow = result[Math.floor(Math.random() * result.length)];
        const deck = result
  .map(row => row.image)
  .filter(
    value =>
      typeof value === 'string' &&
      (value.includes(".png") || value.includes(".jpg") || value.includes(".jpeg") || value.includes(".webp")) &&
      !value.includes("budget")
  );
        for (const key in result[0]) {
          const value = result[0][key];
          if (
            typeof value === 'string' &&
            (value.includes(".png") || value.includes(".jpg") || value.includes(".jpeg") || value.includes(".webp")) &&
            !value.includes("budget")
          ) {
            deck.push(value);
          }
        }

        if (deck.length === 0) {
          throw new Error("No valid deck images found in the result.");
        }

        const embed = new EmbedBuilder()
          .setTitle(randomRow.name)
          .setDescription(randomRow.description)
          .setColor("Random")
          .addFields({
            name: "Deck Type",
            value: `**__${randomRow.type}__**`,
            inline: true,
          }, {
            name: "Archetype",
            value: `**__${randomRow.archetype}__**`,
            inline: true,
          }, {
            name: "Deck Cost",
            value: `${randomRow.cost.toString()}<:spar:1057791557387956274>`,
            inline: true,
          })
          .setFooter({text: randomRow.creator})
          .setImage(randomRow.image);

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: "Oops, something went wrong or no decks were found. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const heroDeckTables = {
      "Beta Carrotina": "bcdecks", "Citron": "ctdecks", "Captain Combustible": "ccdecks",
      "Chompzilla": "czdecks", "Grass Knuckles": "gkdecks", "Green Shadow": "gsdecks",
      "Night Cap": "ncdecks", "Rose": "rodecks", "Solar Flare": "sfdecks",
      "Spudow": "spdecks", "Wall Knight": "wkdecks", "Brain Freeze": "bfdecks",
      "Electric Boogaloo": "ebdecks", "Huge Giganticus": "hgdecks", "Impfinity": "ifdecks",
      "Immorticia": "imdecks", "Neptuna": "ntdecks", "Professor Brainstorm": "pbdecks",
      "Rustbolt": "rbdecks", "Smash": "smdecks", "Zmech": "zmdecks", "Super Brainz": "sbdecks",
    };
    const tableName = heroDeckTables[heroInput];

    if (heroInput === "na") {
      const query = `SELECT * FROM sbdecks where type NOT LIKE '%budget%'
      union all SELECT * from ccdecks where type NOT LIKE '%budget%'
      union all SELECT * from sfdecks where type NOT LIKE '%budget%'
      union all SELECT * from rodecks where type NOT LIKE '%budget%'
      union all SELECT * from gsdecks where type NOT LIKE '%budget%'
      union all SELECT * from wkdecks where type NOT LIKE '%budget%'
      union all SELECT * from czdecks where type NOT LIKE '%budget%'
      union all SELECT * from spdecks where type NOT LIKE '%budget%'
      union all SELECT * from ctdecks where type NOT LIKE '%budget%'
      union all SELECT * from bcdecks where type NOT LIKE '%budget%'
      union all SELECT * from gkdecks where type NOT LIKE '%budget%'
      union all SELECT * from ncdecks where type NOT LIKE '%budget%'
      union all SELECT * from hgdecks where type NOT LIKE '%budget%'
      union all SELECT * from zmdecks where type NOT LIKE '%budget%'
      union all SELECT * from smdecks where type NOT LIKE '%budget%'
      union all SELECT * from ifdecks where type NOT LIKE '%budget%'
      union all SELECT * from rbdecks where type NOT LIKE '%budget%'
      union all SELECT * from ebdecks where type NOT LIKE '%budget%'
      union all SELECT * from bfdecks where type NOT LIKE '%budget%'
      union all SELECT * from pbdecks where type NOT LIKE '%budget%'
      union all SELECT * from imdecks where type NOT LIKE '%budget%'
      union all SELECT * from ntdecks where type NOT LIKE '%budget%'`;
      await getAndSendRandomDeck(query);
    } else if (heroInput === "Plants") {
      const query = `SELECT * from ccdecks where type NOT LIKE '%budget%' 
      union all SELECT * from sfdecks where type NOT LIKE '%budget%'
      union all SELECT * from rodecks where type NOT LIKE '%budget%'
      union all SELECT * from gsdecks where type NOT LIKE '%budget%'
      union all SELECT * from wkdecks where type NOT LIKE '%budget%'
      union all SELECT * from czdecks where type NOT LIKE '%budget%'
      union all SELECT * from spdecks where type NOT LIKE '%budget%'
      union all SELECT * from ctdecks where type NOT LIKE '%budget%'
      union all SELECT * from bcdecks where type NOT LIKE '%budget%'
      union all SELECT * from gkdecks where type NOT LIKE '%budget%'
      union all SELECT * from ncdecks where type NOT LIKE '%budget%'`;
      await getAndSendRandomDeck(query);
    } else if (heroInput === "Zombies") {
      const query = `SELECT * FROM sbdecks where type NOT LIKE '%budget%' 
      union all SELECT * from hgdecks where type NOT LIKE '%budget%' 
      union all SELECT * from zmdecks where type NOT LIKE '%budget%'
      union all SELECT * from smdecks where type NOT LIKE '%budget%'
      union all SELECT * from ifdecks where type NOT LIKE '%budget%'
      union all SELECT * from rbdecks where type NOT LIKE '%budget%'
      union all SELECT * from ebdecks where type NOT LIKE '%budget%'
      union all SELECT * from bfdecks where type NOT LIKE '%budget%'
      union all SELECT * from pbdecks where type NOT LIKE '%budget%'
      union all SELECT * from imdecks where type NOT LIKE '%budget%'
      union all SELECT * from ntdecks where type NOT LIKE '%budget%'`;
      await getAndSendRandomDeck(query);
    } else if (tableName) {
      // This is now the final case for a valid hero
      const query = `SELECT * FROM ${tableName} where type NOT LIKE '%budget%'`;
      await getAndSendRandomDeck(query);
    } else {
      // This handles any other invalid input
      await interaction.reply({
        content: "Invalid hero name. Please try again.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
