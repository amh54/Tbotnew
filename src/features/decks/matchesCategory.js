/**
 * @description Checks if a deck matches a specific category
 * @param {Object} row The database row object
 * @param {string} cat The category to check against
 * @returns {boolean} Whether the deck matches the category
 */
function matchesCategory(row, cat) {
  // Add safety checks
  if (!row) return false;
  
  const t = (row.typeNorm || row.type || "").toLowerCase();
  const a = (row.archetypeNorm || row.archetype || "").toLowerCase();
  
  if (cat === "all") return true;
  if (cat === "competitive" || cat === "comp") {
    return t.includes("competitive") || t.includes("comp") || 
           a.includes("competitive") || a.includes("comp");
  }
  if (cat === "budget") return t.includes("budget") || a.includes("budget");
  if (cat === "ladder") return t.includes("ladder") || a.includes("ladder");
  if (cat === "meme") return t.includes("meme") || a.includes("meme");
  if (cat === "combo") return t.includes("combo") || a.includes("combo");
  if (cat === "control") return a.includes("control") || t.includes("control");
  if (cat === "midrange") {
    return a.includes("midrange") || t.includes("midrange") ||
           a.includes("mid") || t.includes("mid");
  }
  if (cat === "tempo") return t.includes("tempo") || a.includes("tempo");
  if (cat === "aggro") return a.includes("aggro") || t.includes("aggro");
  return false;
}

module.exports = matchesCategory;