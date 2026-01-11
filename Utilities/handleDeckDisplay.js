const buildDeckEmbedFromRow = require("./buildDeckEmbedFromRow");
/**
 * Handles standard deck display (default case)
 */
async function handleDeckDisplay(row, message, tableConfig, dbTableColors) {
  const embed = buildDeckEmbedFromRow(row, tableConfig.table, dbTableColors);
  await message.channel.send({ embeds: [embed] });
}
module.exports = handleDeckDisplay;