const { EmbedBuilder } = require("discord.js");
/**
 * @description Creates a help embed for a command
 * @param {*} title The title of the embed
 * @param {*} description The description of the embed
 * @param {*} thumbnail The thumbnail image URL
 * @param {*} color The color of the embed
 * @param {*} footer The footer text of the embed
 * @returns {EmbedBuilder} The constructed embed
 */
function createHelpEmbed(title, description, thumbnail,color, footer) {
  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(thumbnail)
    .setColor(color);
  if (footer) e.setFooter({ text: footer });
  return e;
}
module.exports = createHelpEmbed;