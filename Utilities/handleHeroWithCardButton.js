/**
 * Handles hero commands with card button (heroname, hero_emoji, herocard_button)
 */
async function handleHeroWithButton(row, message) {
  try {
    const createHeroEmbedWithButton = require("./createHeroEmbedWithButton");
    const { embed, button } = await createHeroEmbedWithButton(row);
    
    if (row.herocard_button && row.buttonemoji) {
      const cardInfoButton = new ButtonBuilder()
        .setCustomId(`cardinfo_${row.herocard_button}`)
        .setLabel(row.herocard_button.toString())
        .setEmoji(row.buttonemoji.toString())
        .setStyle(ButtonStyle.Primary);
      button.addComponents(cardInfoButton);
    }
    
    await message.channel.send({ embeds: [embed], components: [button] });
  } catch (error) {
    console.error("Error handling hero command:", error);
    console.error("Row data:", JSON.stringify(row, null, 2));
    await message.channel.send("An error occurred while loading hero data.");
  }
}
module.exports = handleHeroWithButton;