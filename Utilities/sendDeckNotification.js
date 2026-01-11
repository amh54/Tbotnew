const { EmbedBuilder } = require("discord.js");  
/**
 * Sends a notification for a new or updated deck
 */
async function sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, isNewDeck) {
  try {
    const channel = await client.channels.fetch(notificationChannelId).catch(() => null);
    if (!channel) return;

    const deckColor = dbTableColors[tableConfig.table] || "#00FF00";
    const statusText = isNewDeck ? "✨ New Deck Added" : "🔄 Deck Updated";
    
    const embed = new EmbedBuilder()
      .setTitle(`${statusText}: ${row.name || "Unknown"}`)
      .setDescription(row.description || "No description provided")
      .setColor(deckColor)
      .addFields(
        { name: "Deck Type", value: `**__${row.type || "N/A"}__**`, inline: true },
        { name: "Archetype", value: `**__${row.archetype || "N/A"}__**`, inline: true },
        { name: "Deck Cost", value: row.cost ? `${row.cost} <:spar:1057791557387956274>` : "**__N/A__**", inline: true }
      )
      .setFooter({ text: `Created by ${row.creator || "Unknown"}` });
    
    if (row.image && typeof row.image === "string" && row.image.startsWith("http")) {
      embed.setImage(row.image);
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to send deck notification:", error);
  }
}

module.exports = sendDeckNotification;
