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
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  let similarity = ((maxLen - distance) / maxLen) * 100;

  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const containmentBonus = (minLen / maxLen) * 30;
    similarity = Math.max(similarity, containmentBonus);
  }

  const chars1 = new Set(s1.split(''));
  const chars2 = new Set(s2.split(''));
  const commonChars = [...chars1].filter(c => chars2.has(c)).length;
  const totalUniqueChars = new Set([...chars1, ...chars2]).size;
  if (totalUniqueChars > 0) {
    const charSimilarity = (commonChars / totalUniqueChars) * 100;
    similarity = Math.max(similarity, charSimilarity * 0.8);
  }

  const startLen = Math.min(4, Math.min(s1.length, s2.length));
  if (startLen > 0 && s1.substring(0, startLen) === s2.substring(0, startLen)) {
    similarity += 10;
  }

  return Math.min(100, similarity);
}

let cardNamesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

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

    const allCardNames = new Set();

    for (const table of cardTables) {
      try {
        const [rows] = await db.query(`SELECT card_name FROM \`${table}\``);
        for (const row of rows) {
          if (row.card_name) {
            allCardNames.add(row.card_name);
          }
        }
      } catch (error) {
        console.error(`Error querying ${table}:`, error);
      }
    }

    cardNamesCache = Array.from(allCardNames);
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
async function findClosestCardName(input, threshold = 50) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const cardNames = await getAllCardNames();
  const sanitizedInput = input.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");

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
