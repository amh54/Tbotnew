const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

function buildDeckbuilderListDescription(rows, currentName) {
  const names = rows
    .map((row) => {
      const name = row.deckbuilder_name;
      return name === currentName ? `• **${name}**` : `• ${name}`;
    })
    .join("\n");

  const description = [
    "Here are all deckbuilders for Tbot. Use the buttons below to browse them.",
    "",
    "**Deckbuilder names**",
    names,
  ].join("\n");

  return description.length > 1800 ? `${description.slice(0, 1797)}...` : description;
}

function buildDeckbuilderNavigationRow(index, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("deckbuilderpager_prev")
      .setLabel(index === 0 ? "Back to list" : "Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(index <= -1),
    new ButtonBuilder()
      .setCustomId("deckbuilderpager_next")
      .setLabel(index === total - 1 ? "Back to list" : "Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(total <= 0)
  );
}

function buildDeckbuilderListEmbed(rows) {
  const embed = new EmbedBuilder()
    .setTitle(`Deckbuilders`)
    .setDescription(
      [
        "Here are all deckbuilders for Tbot. Use the buttons below to browse them.",
        "",
        "**Deckbuilder names**",
        rows.map((row) => `• ${row.deckbuilder_name}`).join("\n"),
      ].join("\n")
    )
    .setColor("#8A2BE2");

  return embed;
}

async function buildDeckbuilderEmbed(row, index, total, client) {
  const embed = new EmbedBuilder()
    .setTitle(`${row.deckbuilder_name}`)
    .setDescription(
      [
        `Use the buttons below to scroll through deckbuilders.`,
        "",
        `Deckbuilder name: ${row.deckbuilder_name}`,
        `Total decks listed for this deckbuilder: ${row.numb_of_decks ?? 0}`,
      ].join("\n")
    )
    .setColor(row.color || "#FFD700");

  if (row.userID) {
    try {
      const user = await client.users.fetch(row.userID).catch(() => null);
      if (user) {
        embed.setThumbnail(user.displayAvatarURL());
        embed.addFields({ name: "Discord User", value: `<@${row.userID}>`, inline: true });
      }
    } catch (error) {
      console.error("Error fetching deckbuilder user avatar:", error);
    }
  }

  return embed;
}

async function handleDeckbuilderPager(interaction) {
  if (!interaction.client.deckbuilderPagerData) {
    return interaction.reply({
      content: "Deckbuilder data is no longer available. Please run the command again.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const pagerData = interaction.client.deckbuilderPagerData.get(interaction.message.id);
  if (!pagerData) {
    return interaction.reply({
      content: "Deckbuilder data is no longer available. Please run the command again.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const direction = interaction.customId === "deckbuilderpager_next" ? 1 : -1;
  let nextIndex;

  if (pagerData.index === -1) {
    nextIndex = direction === 1 ? 0 : -1;
  } else if (pagerData.index === 0 && direction === -1) {
    nextIndex = -1;
  } else if (pagerData.index === pagerData.rows.length - 1 && direction === 1) {
    nextIndex = -1;
  } else {
    nextIndex = Math.max(0, Math.min(pagerData.rows.length - 1, pagerData.index + direction));
  }

  pagerData.index = nextIndex;
  interaction.client.deckbuilderPagerData.set(interaction.message.id, pagerData);

  const embed = nextIndex === -1
    ? buildDeckbuilderListEmbed(pagerData.rows)
    : await buildDeckbuilderEmbed(
        pagerData.rows[nextIndex],
        nextIndex,
        pagerData.rows.length,
        interaction.client
      );

  const components = [buildDeckbuilderNavigationRow(nextIndex, pagerData.rows.length)];

  return interaction.update({ embeds: [embed], components });
}

module.exports = {
  name: `deckbuilders`,
  buildDeckbuilderEmbed,
  handleDeckbuilderPager,
  run: async (client, message, args) => {
    const db = client.db || require("../../../index.js");
    const [rows] = await db.query(
      `SELECT deckbuilder_name, color, userID, aliases, numb_of_decks FROM deckbuilders ORDER BY deckbuilder_name ASC`
    );

    if (!rows || rows.length === 0) {
      return message.reply({ content: "No deckbuilders were found." });
    }

    const pagerData = { rows, index: -1 };
    const embed = buildDeckbuilderListEmbed(rows);
    const components = [buildDeckbuilderNavigationRow(-1, rows.length)];
    const response = await message.reply({ embeds: [embed], components });

    if (response?.id) {
      if (!client.deckbuilderPagerData) {
        client.deckbuilderPagerData = new Map();
      }
      client.deckbuilderPagerData.set(response.id, pagerData);
    }
  },
};
