const { EmbedBuilder } = require("discord.js");
/**
 * @description Creates a category embed for a hero's decks
 * @param {*} hero the hero name
 * @param {*} categoryColor the color of the category
 * @param {*} categoryName the name of the category
 * @param {*} deckNames the names of the decks
 * @param {*} total the total number of decks
 * @param {*} thumbnail the thumbnail image URL
 * @returns {EmbedBuilder} The constructed embed
 */
function createCategoryEmbed(hero, categoryColor, categoryName, deckNames, total, thumbnail) {
  const isAll = categoryName.toLowerCase().includes("all");
  
  // Map category names to display names
  const categoryDisplayNames = {
    "comp": "Competitive",
    "competitive": "Competitive",
    "budget": "Budget",
    "ladder": "Ladder", 
    "meme": "Meme",
    "aggro": "Aggro",
    "combo": "Combo",
    "control": "Control",
    "midrange": "Midrange",
    "tempo": "Tempo"
  };

  // Get the proper display name
  const displayName = categoryDisplayNames[categoryName.toLowerCase()] || categoryName;
  
  // Format deck names with proper spacing and capitalization
  const formattedDeckNames = (Array.isArray(deckNames) ? deckNames : [])
    .map((name) => {
      // Split the name to separate deck name from hero name
      const parts = name.split('(');
      if (parts.length === 2) {
        const deckName = parts[0].trim();
        const heroName = parts[1].replace(')', '').trim();
        // Capitalize hero name and bold the deck name
        const capitalizedHero = heroName.charAt(0).toUpperCase() + heroName.slice(1);
        return `**${deckName} (${capitalizedHero})**`;
      } else {
        // Fallback for names without hero in parentheses
        return `**${name.toLowerCase().replaceAll(/\s+/g, "")}**`;
      }
    })
    .join("\n<@1043528908148052089> ");
    
  const description = formattedDeckNames
    ? `\n<@1043528908148052089> ${formattedDeckNames}`
    : "No decks available";
    
  return new EmbedBuilder()
    .setTitle(isAll ? `${hero} Decks` : `${hero} ${displayName} Decks`)
    .setDescription(
      isAll
        ? `All ${hero} decks in Tbot are:${description}`
        : `My ${displayName} ${hero} decks are: ${description}` 
    )
    .setThumbnail(thumbnail)
    .setColor(categoryColor)
    .setFooter({
      text: isAll
        ? `${hero} has ${total} total decks in Tbot\nPlease click on the buttons below to navigate through the decks.`
        : `${hero} have ${total} total ${displayName} decks in Tbot\nPlease click on the buttons below to navigate through the decks.`,
    });
}

module.exports = createCategoryEmbed;