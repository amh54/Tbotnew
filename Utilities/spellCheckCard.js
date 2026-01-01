const db = require("../index.js");
/**
 * @description Calculates Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];


  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }


  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }


  return matrix[len1][len2];
}


/**
 * @description Calculates similarity percentage between two strings
 * Uses multiple methods for more forgiving matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const maxLen = Math.max(s1.length, s2.length);
  const minLen = Math.min(s1.length, s2.length);
  if (maxLen === 0) return 100;


  const lengthRatio = minLen / maxLen;
  if (lengthRatio < 0.3 && minLen < 4) {
    return 0;
  }


  const distance = levenshteinDistance(s1, s2);
  let similarity = ((maxLen - distance) / maxLen) * 100;


  if (minLen >= 3 && (s1.includes(s2) || s2.includes(s1))) {
    const containmentBonus = (minLen / maxLen) * 25;
    similarity = Math.max(similarity, 50 + containmentBonus);
  }


  const startLen = Math.min(4, minLen);
  if (startLen >= 3 && s1.substring(0, startLen) === s2.substring(0, startLen)) {
    similarity += 10;
  }


  return Math.min(100, similarity);
}


let cardNamesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * @description Queries a single table and adds names to the set
 * @param {string} table - Table name
 * @param {string} columnName - Column name to extract
 * @param {Set} namesSet - Set to add names to
 */
async function queryTableAndAddNames(table, columnName, namesSet) {
  try {
    const [rows] = await db.query(`SELECT ${columnName} FROM \`${table}\``);
    rows.forEach(row => {
      const value = row[columnName];
      if (value) {
        namesSet.add(value);
      }
    });
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
  }
}

/**
 * @description Queries multiple tables with the same column name
 * @param {Array<string>} tables - Array of table names
 * @param {string} columnName - Column name to extract
 * @param {Set} namesSet - Set to add names to
 */
async function queryMultipleTables(tables, columnName, namesSet) {
  await Promise.all(
    tables.map(table => queryTableAndAddNames(table, columnName, namesSet))
  );
}

/**
 * @description Gets all card names from the database
 * @returns {Promise<Array<string>>} - Array of card names
 */
async function getAllCardNames() {
  if (cardNamesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cardNamesCache;
  }

  try {
    const cardTables = [
      'guardiancards', 'guardiantricks',
      'kabloomcards', 'kabloomtricks',
      'megagrowcards', 'megagrowtricks',
      'smartycards', 'smartytricks',
      'solarcards', 'solartricks',
      'beastlycards', 'beastlytricks',
      'brainycards', 'brainytricks',
      'crazycards', 'crazytricks',
      'heartycards', 'heartytricks',
      'sneakycards', 'sneakytricks'
    ];
    
    const deckTables = [
      "rbdecks", "zmdecks", "ctdecks",
      "gsdecks", "bcdecks", "bfdecks",
      "ccdecks", "czdecks", "ebdecks",
      "gkdecks", "hgdecks", "sbdecks",
      "ifdecks", "imdecks", "ncdecks",
      "ntdecks", "pbdecks", "rodecks",
      "sfdecks", "smdecks", "spdecks",
      "wkdecks"
    ];

    const commandNames = new Set();

    await queryMultipleTables(cardTables, 'card_name', commandNames);
    await queryMultipleTables(deckTables, 'name', commandNames);
    await queryTableAndAddNames('herocommands', 'heroname', commandNames);
    await queryTableAndAddNames('deckbuilders', 'deckbuilder_name', commandNames);
    await queryTableAndAddNames('helpcommands', 'herocommand', commandNames);


    cardNamesCache = Array.from(commandNames);
    cacheTimestamp = Date.now();
    return cardNamesCache;
  } catch (error) {
    console.error('Error getting card names:', error);
    return cardNamesCache || [];
  }
}


/**
 * @description Finds the closest matching card name for a given input
 * @param {string} input - The input string to match
 * @param {number} threshold - Minimum similarity percentage (default: 50, more forgiving)
 * @returns {Promise<string|null>} - The closest matching card name or null if no match above threshold
 */
async function findClosestCardName(input, threshold = 60) {
  if (!input || typeof input !== 'string') {
    return null;
  }


  const cardNames = await getAllCardNames();
  const sanitizedInput = input.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");


  // Reject very short inputs that are unlikely to be card names
  if (sanitizedInput.length < 2) {
    return null;
  }


  let bestMatch = null;
  let bestSimilarity = 0;


  for (const cardName of cardNames) {
    const sanitizedCardName = cardName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
    const similarity = calculateSimilarity(sanitizedInput, sanitizedCardName);


    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = cardName;
    }
  }


  if (bestMatch && bestSimilarity >= threshold) {
    return bestMatch;
  }


  return null;
}



module.exports = {
  findClosestCardName,
  getAllCardNames,
  calculateSimilarity
};