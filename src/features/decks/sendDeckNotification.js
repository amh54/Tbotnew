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

function getStatusText(notificationType, changedFields) {
  const statusMap = {
    'new': "✨ New Deck Added",
    'delete': "🗑️ Deck Deleted"
  };

  if (statusMap[notificationType]) {
    return statusMap[notificationType];
  }

  // Update cases
  const hasDescription = changedFields.includes('description');
  const hasType = changedFields.includes('type');
  const hasImage = changedFields.includes('image');

  if (hasDescription && !hasImage) return "🔄 Description Updated";
  if (hasType && !hasImage) return "🔄 Deck Type Updated";
  return "🔄 Deck Updated";
}

function addDeckFields(embed, row, changedFields, existingRow) {
  const showTypeChange = changedFields.includes('type') && existingRow?.type;

  if (showTypeChange) {
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
}

function shouldSendNotification(notificationType, changedFields) {
  if (notificationType !== 'update') return true;
  return changedFields.includes('image') || changedFields.includes('description') || changedFields.includes('type');
}

/**
 * Sends a notification for a new, updated, or deleted deck
 * @param {string|Object} notificationChannelId - Channel/thread ID or notification target object
 * @param {Object} options - Notification options
 * @param {string} options.notificationType - 'new', 'update', or 'delete'
 * @param {Array<string>} options.changedFields - Array of field names that changed (for updates)
 * @param {Object} options.existingRow - Previous row data for showing changes (for updates)
 */
async function sendDeckNotification(client, notificationChannelId, row, tableConfig, dbTableColors, options = {}) {
  const notificationType = options.notificationType || 'new';
  const changedFields = options.changedFields || [];
  const existingRow = options.existingRow || null;
  
  try {
    console.log(`[sendDeckNotification] notificationType: ${notificationType}, changedFields:`, changedFields);
    
    if (!shouldSendNotification(notificationType, changedFields)) {
      return;
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
    const statusText = getStatusText(notificationType, changedFields);
    
    const embed = new EmbedBuilder()
      .setTitle(`${statusText}: ${row.name || "Unknown"}`)
      .setDescription(row.description || "No description provided")
      .setColor(deckColor);
    
    addDeckFields(embed, row, changedFields, existingRow);
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
