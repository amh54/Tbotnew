async function handleHeroCommand(row, message) {
  try {
    const createHeroEmbedWithButton = require("./createHeroEmbedWithButton.js");
    const { embed, button } = await createHeroEmbedWithButton(row);
    await message.channel.send({ embeds: [embed], components: [button] });
  } catch (error) {
    console.error("Error handling hero command:", error);
    await message.channel.send("An error occurred while loading hero data.");
  }
}
module.exports = handleHeroCommand;