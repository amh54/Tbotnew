const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function categorizeCommands(slashCommands) {
  const heroDecks = [];
  const others = [];

  for (const c of slashCommands) {
    const mention = c.id ? `</${c.name}:${c.id}>` : `/${c.name}`;
    const isHeroDeck =
      c.name !== "herodecks" &&
      /decks$/i.test(c.name) &&
      /decks/i.test(c.description);

    if (isHeroDeck) {
      heroDecks.push(`- ${mention} — ${c.description}`);
    } else {
      others.push(`**${mention}**\n${c.description}`);
    }
  }

  return { heroDecks, others };
}

function buildHeroDeckFields(heroDecks) {
  const fields = [];
  let buffer = [];

  for (const line of heroDecks) {
    const next = [...buffer, line].join("\n");
    if (next.length > 1024) {
      fields.push(buffer.join("\n"));
      buffer = [line];
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) fields.push(buffer.join("\n"));

  return fields;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View help categories for Tbot"),
  async execute(interaction) {
    const fetched = await interaction.client.application.commands.fetch();
    const slashCommands = Array.from(fetched.values())
      .map(cmd => ({
        id: cmd?.id,
        name: cmd?.name,
        description: cmd?.description || "No description provided.",
      }))
      .filter(cmd => cmd.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    const { heroDecks, others } = categorizeCommands(slashCommands);

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setTitle("Slash Commands")
      .setDescription(others.length ? others.join("\n\n") : "No slash commands found.")
      .setFooter({ text: `Total Slash Commands: ${slashCommands.length}` });

    if (heroDecks.length) {
      const fields = buildHeroDeckFields(heroDecks);
      fields.forEach((value, i) => {
        embed.addFields({
          name: i === 0 ? "Hero Decks" : "Hero Decks (cont.)",
          value
        });
      });
    }

    return interaction.reply({ embeds: [embed] });
  }
};
