function buildMessageFromInteraction(interaction) {
  const reply = async (payload) => {
    if (payload && typeof payload === "object" && payload.withResponse === undefined) {
      payload = { ...payload, withResponse: true };
    }
    const response = interaction.replied || interaction.deferred
      ? await interaction.followUp(payload)
      : await interaction.reply(payload);
    if (response?.resource?.message) {
      return response.resource.message;
    }
    if (typeof interaction.fetchReply === "function") {
      return interaction.fetchReply();
    }
    return response;
  };

  const channel = {
    ...interaction.channel,
    send: (payload) => {
      if (typeof payload === "string") {
        return reply({ content: payload });
      }
      if (!payload || typeof payload !== "object") {
        return reply({ content: " " });
      }
      const hasContent = typeof payload.content === "string" && payload.content.length > 0;
      const hasEmbeds = Array.isArray(payload.embeds) && payload.embeds.length > 0;
      const hasComponents = Array.isArray(payload.components) && payload.components.length > 0;
      const hasFiles = Array.isArray(payload.files) && payload.files.length > 0;
      if (!hasContent && !hasEmbeds && !hasComponents && !hasFiles) {
        return reply({ content: " " });
      }
      return reply(payload);
    },
  };

  return {
    client: interaction.client,
    channel,
    author: interaction.user,
    guild: interaction.guild,
    member: interaction.member,
    content: "",
    reply,
  };
}

module.exports = { buildMessageFromInteraction };
