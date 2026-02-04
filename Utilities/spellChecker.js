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
  const s1 = String(str1).toLowerCase();
  const s2 = String(str2).toLowerCase();
  const maxLen = Math.max(s1.length, s2.length);
  const minLen = Math.min(s1.length, s2.length);
  if (maxLen === 0) return 100;


  const lengthRatio = minLen / maxLen;
  if (lengthRatio < 0.3 && minLen < 4) {
    return 0;
  }


  const distance = levenshteinDistance(s1, s2);
  let similarity = ((maxLen - distance) / maxLen) * 100;


  // Containment bonus: only apply if the shorter string is substantial enough
  // and the length difference isn't too extreme
  if (minLen >= 3 && (s1.includes(s2) || s2.includes(s1))) {
    const lengthDiff = Math.abs(s1.length - s2.length);
    if (lengthDiff <= 3 || lengthRatio >= 0.7) {
      const containmentBonus = (minLen / maxLen) * 25;
      similarity = Math.max(similarity, 50 + containmentBonus);
    }
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
 * @description List of words that should never be spell-checked or corrected
 * These are common words, commands, or phrases that users might type
 */
const excludedWords = new Set([
  "bfmidgargs", "spacestars", "gargstar22", 
  "fuck", "marxbolt"
]);

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
 * @description Queries a single table and adds comma-separated aliases to the set
 * @param {string} table - Table name
 * @param {string} columnName - Column name containing comma-separated aliases
 * @param {Set} namesSet - Set to add aliases to
 */
async function queryTableAndAddAliases(table, columnName, namesSet) {
  try {
    const [rows] = await db.query(`SELECT ${columnName} FROM \`${table}\``);
    rows.forEach(row => {
      const value = row[columnName];
      if (value && typeof value === 'string') {
        // Split by comma and trim whitespace from each alias
        const aliases = value.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0);
        aliases.forEach(alias => namesSet.add(alias));
      }
    });
  } catch (error) {
    console.error(`Error querying aliases from ${table}:`, error);
  }
}

/**
 * @description Queries multiple tables with the same column name
 * @param {Array<string>} tables - Array of table names
 * @param {string} columnName - Column name to extract
 * @param {Set} namesSet - Set to add names to
 */
async function queryMultipleTables(tables, columnName, namesSet) {
  // Check if this is an aliases column (comma-separated values)
  const isAliasColumn = columnName.toLowerCase().includes('alias');
  
  await Promise.all(
    tables.map(table => {
      if (isAliasColumn) {
        return queryTableAndAddAliases(table, columnName, namesSet);
      } else {
        return queryTableAndAddNames(table, columnName, namesSet);
      }
    })
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
    await queryMultipleTables(cardTables, 'aliases', commandNames);
    await queryMultipleTables(deckTables, 'name', commandNames);
    await queryMultipleTables(deckTables, 'aliases', commandNames);
    await queryTableAndAddNames('herocommands', 'heroname', commandNames);
    await queryTableAndAddAliases('herocommands', 'aliases', commandNames);
    await queryTableAndAddNames('deckbuilders', 'deckbuilder_name', commandNames);
    await queryTableAndAddAliases('deckbuilders', 'aliases', commandNames);
    await queryTableAndAddNames('helpcommands', 'herocommand', commandNames);
    await queryTableAndAddAliases('helpcommands', 'aliases', commandNames);


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

  // Join and normalize the input string
  const joinedInput = String(input).trim();
  
  // Sanitize the input by removing all non-alphanumeric characters
  // This joins multi-word inputs like "gs decka" -> "gsdecka"
  let sanitizedInput = joinedInput.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");

  // Check if input is in the excluded words list (exact match only)
  if (excludedWords.has(sanitizedInput)) {
    return null;
  }

  // Strip common suffixes that users might add (like "decks")

  const commonSuffixes = ['decks', 'deck', 'card'];
  for (const suffix of commonSuffixes) {
    if (sanitizedInput.endsWith(suffix) && sanitizedInput.length > suffix.length + 3) {
      sanitizedInput = sanitizedInput.slice(0, -suffix.length);
      break;
    }
  }

  // Check again after suffix removal
  if (excludedWords.has(sanitizedInput)) {
    return null;
  }

  // Reject very short inputs that are unlikely to be card names
  if (sanitizedInput.length < 2) {
    return null;
  }

  // Reject very long inputs that are clearly multi-word queries, not card names
  if (sanitizedInput.length > 15) {
    return null;
  }

  const cardNames = await getAllCardNames();


  let bestMatch = null;
  let bestSimilarity = 0;


  for (const cardName of cardNames) {
    const sanitizedCardName = String(cardName).toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
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