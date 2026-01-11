
const buildCardEmbedFromRow = require("./buildCardEmbedFromRow");

/**
 * Handles superpower cards or token cards (description contains "Superpower" or set_rarity is "Token")
 */
async function handleSuperpowerOrToken(row, message, tableConfig, dbTableColors) {
  const embed = buildCardEmbedFromRow(row, tableConfig.table, dbTableColors);
  
  console.log("Built card embed for superpower or token");
  await message.channel.send({ embeds: [embed] });
}
module.exports = handleSuperpowerOrToken;