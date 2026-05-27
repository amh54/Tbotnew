const { EmbedBuilder, ChannelType } = require("discord.js");  

function resolveNotificationTarget(notificationType, notificationTarget) {
  if (!notificationTarget) return null;

  if (typeof notificationTarget === "string") {
    return notificationTarget;
  }

  if (notificationType === "new") {
    return notificationTarget.newDeckThreadId || notificationTarget.defaultChannelId || null;
  }

  if (notificationType === "update") {
    return notificationTarget.updateDeckThreadId || notificationTarget.defaultChannelId || null;
  }

  return notificationTarget.defaultChannelId || null;
}

/**
 * Sends a notification for a new, updated, or deleted deck
 * @param {string|Object} notificationChannelId - Channel/thread ID or notification target object
 * @param {string} notificationType - 'new', 'update', or 'delete'
 * @param {Array<string>} changedFields - Array of field names that changed (for updates)
 * @param {Object} existingRow - Previous row data for showing changes (for updates)
 */
async function sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, notificationType = 'new', changedFields = [], existingRow = null) {
  try {
    console.log(`[sendDeckNotification] notificationType: ${notificationType}, changedFields:`, changedFields);
    
    if (notificationType === 'update') {
      const shouldNotify = changedFields.includes('image') || changedFields.includes('description') || changedFields.includes('type');
      console.log(`[sendDeckNotification] shouldNotify: ${shouldNotify}`);
      if (!shouldNotify) return;
    }

    const targetId = resolveNotificationTarget(notificationType, notificationChannelId);
    if (!targetId) {
      throw new Error(`No notification target configured for type: ${notificationType}`);
    }

    const channel = await client.channels.fetch(targetId).catch(() => null);
    if (!channel) {
      throw new Error(`Failed to fetch notification target channel/thread: ${targetId}`);
    }

    if (channel.type === ChannelType.GuildForum) {
      throw new Error(
        `Notification target ${targetId} is a forum parent channel. Configure a thread ID instead.`
      );
    }

    const deckColor = dbTableColors[tableConfig.table] || "#00FF00";
    
    let statusText;
    if (notificationType === 'new') {
      statusText = "✨ New Deck Added";
    } else if (notificationType === 'delete') {
      statusText = "🗑️ Deck Deleted";
    } else if (changedFields.includes('description') && !changedFields.includes('image')) {
      // Only show "Description Updated" if ONLY description changed (not image)
      statusText = "🔄 Description Updated";
    } 
    else if(changedFields.includes('type') && !changedFields.includes('image')){
      statusText = "🔄 Deck Type Updated";
    }
    else {
      statusText = "🔄 Deck Updated";
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${statusText}: ${row.name || "Unknown"}`)
      .setDescription(row.description || "No description provided")
      .setColor(deckColor);
    
    // Show type change if it occurred
    if (changedFields.includes('type') && existingRow?.type) {
      embed.addFields(
        { name: "Deck Type", value: `**${existingRow.type}** → **${row.type || "N/A"}**`, inline: true },
        { name: "Archetype", value: `**__${row.archetype || "N/A"}__**`, inline: true },
        { name: "Deck Cost", value: row.cost ? `${row.cost} <:spar:1057791557387956274>` : "**__N/A__**", inline: true }
      );
    } else {
      embed.addFields(
        { name: "Deck Type", value: `**__${row.type || "N/A"}__**`, inline: true },
        { name: "Archetype", value: `**__${row.archetype || "N/A"}__**`, inline: true },
        { name: "Deck Cost", value: row.cost ? `${row.cost} <:spar:1057791557387956274>` : "**__N/A__**", inline: true }
      );
    }
    
    embed.setFooter({ text: `${row.creator || "Unknown"}` });
    
    if (row.image && typeof row.image === "string" && row.image.startsWith("http")) {
      embed.setImage(row.image);
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to send deck notification:", error);
    throw error;
  }
}

module.exports = sendDeckNotification;
