const { SlashCommandBuilder, ChannelType, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const axios = require('axios');
const {validateDeckImage} = require('../../Utilities/validateDeckImage');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('submitdeck')
    .setDescription('Submit a PvZ Heroes decklist to Tbot')
    .addStringOption(option =>
      option.setName('name').setDescription('Name of the deck').setRequired(true))
    .addStringOption(option =>
      option.setName('description').setDescription('Short description of the deck').setRequired(true))
    .addIntegerOption(option =>
      option.setName('deck_cost').setDescription('The cost of the deck').setRequired(true))
    .addStringOption(option =>
      option.setName('deck_archetype').setDescription('The archetype for the deck').setRequired(true)
      .addChoices(
        { name: 'Aggro', value: 'Aggro'},
        { name: 'Control', value: 'Control'},
        { name: 'Combo', value: 'Combo'},
        { name: 'Midrange', value: 'Midrange'},
        { name: "Tempo", value: 'Tempo'}, 
        {name: 'Aggro Combo', value: 'Aggro Combo'},
        {name: 'Combo Midrange', value: 'Combo Midrange'},
        {name: 'Control Combo', value: 'Control Combo'},
        {name: 'Combo Tempo', value: 'Combo Tempo'},
        {name: 'Midrange Tempo', value: 'Midrange Tempo'}
      ))
          .addStringOption(option =>
      option.setName('deck_type').setDescription('The type of deck it is').setRequired(true)
      .addChoices(
        {name: 'Budget', value: 'Budget'},
        { name: 'Competitive', value: 'Competitive'},
        { name: 'Ladder', value: 'Ladder'},
        { name: 'Meme', value: 'Meme'},
      ))
      .addStringOption(option =>
      option.setName('hero').setDescription('The hero of the deck').addChoices(
        { name: "Captain Combustible", value: "1100172143603482786"},
        { name: "Chompzilla", value: "1100171601045106819"}, 
        { name: "Citron/BC", value: "1100171558263193700"}, 
        {name: "Grass Knuckles", value: "1100171819148906628"}, 
        {name: "Green Shadow", value: "1100172254983241820"},
        {name: "Night Cap", value: "1100171997167747172"},
        {name: "Rose", value: "1100171855316406343"},
        {name: "Solar Flare", value: "1100171646557491220"},
        {name: "Spudow", value: "1100171758256013412"}, 
        {name: "Wall Knight", value: "1100171712391295006"}, 
        {name: "Brain Freeze", value: "1100170721994477668"}, 
        {name: "Electric Boogaloo", value: "1100171042380578857"},
        {name: "Huge Giganticus/SB", value: "1100170925208502282"},
        {name: "Impfinity", value: "1100170791594762260"}, 
        {name: "Immorticia", value: "1100171253790285904"}, 
        {name: "Neptuna", value: "1100170647050649620"}, 
        {name: "Rustbolt", value: "1100171459785150585"}, 
        {name: "Professor Brainstorm", value: "1100171115504078901"}, 
        {name: "Smash", value: "1100171177529446492"}, 
        {name: "Zmech", value: "1100170981013729410"},
      ).setRequired(true))
      .addStringOption(option => option.setName("deck_creator").setDescription("The creator of the deck").setRequired(true))
    .addAttachmentOption(option =>
      option.setName('image').setDescription('image of the decklist').setRequired(true))
.addStringOption(option => option.setName('aliases').setDescription('Comma-separated list of additional names for the deck (optional)').setRequired(false)),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const decktype = interaction.options.getString('deck_type');
    const deckarchetype = interaction.options.getString('deck_archetype');
    const image = interaction.options.getAttachment('image');
    const deckcost = interaction.options.getInteger('deck_cost');
    const hero = interaction.options.getString('hero');
    const deckcreator = interaction.options.getString('deck_creator');
    const aliases = interaction.options.getString('aliases') || '';
    const imageUrl = image.url;

    // Defer reply since validation may take time
    await interaction.deferReply();

    // Validate the deck image
    console.log(`[submitdeck] Validating deck image for: ${name}`);
    const validation = await validateDeckImage(imageUrl);
    
    if (!validation.isValid) {
      console.log(`[submitdeck] Validation failed:`, validation);
      return interaction.editReply({
        content: `❌ **Invalid image detected!**\n\n` +
          `The uploaded image doesn't appear to be a PvZ Heroes deck screenshot.\n\n` +
          `Please ensure you're uploading:\n` +
          `• A full deck screenshot from PvZ Heroes\n` +
          `• Not a cropped or edited image\n` +
          `• A clear, readable screenshot\n\n` +
          `If you believe this is an error, please contact <@625172218120372225>.`,
        ephemeral: true
      });
    }

    console.log(`[submitdeck] Validation passed for: ${name}`);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'utf-8');
    const file = new AttachmentBuilder(buffer, { name: 'deck.png' });
       const tbotServer = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Tbot Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/2NSwt96vmS'),
      );
     const replyMessage = await interaction.editReply({
      content: `✅ Your deck has been submitted successfully!`,
      files: [file], 
      components: [tbotServer],
      fetchReply: true
      });
      const permanentUrl = replyMessage.attachments.first().url;

      const forumChannel = interaction.client.channels.cache.get('1100160031128830104');
    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      return interaction.reply({ content: '❌ Forum channel not found or invalid.', ephemeral: true });
    }
    const fields = [
  { name: 'Deck Type', value: `**__${decktype}__**`, inline: true },
  { name: 'Deck Archetype', value: `**__${deckarchetype}__**`, inline: true },
  { name: 'Deck Cost', value: `${deckcost.toString()}<:spar:1057791557387956274>`, inline: true },
];
if (aliases && aliases.trim() !== '') {
  fields.push({ name: 'Aliases', value: aliases, inline: true });
}
    const embed = new EmbedBuilder()
      .setTitle(`${name}`)
      .setDescription(description)
        .addFields(fields) 
      .setColor("Random")
      .setFooter({ text: `Created By ${deckcreator} | Submitted by ${interaction.user.tag}`});

    if (image?.contentType?.startsWith('image/')) {
      embed.setImage(permanentUrl);
    }

    // Create the thread in the forum
    const thread = await forumChannel.threads.create({
      name: name,
      message: {
        embeds: [embed],
      },
      appliedTags: [hero],
    });
    const starterMessage = await thread.fetchStarterMessage();
    await starterMessage.pin();
    await starterMessage.react('<:upvote:1081953853903220876>');
    await starterMessage.react('<:downvote:1081953860534403102>');
  },
};