const db = require("../index.js");
<<<<<<< HEAD
=======

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
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

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
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

<<<<<<< HEAD

  return matrix[len1][len2];
}


=======
  return matrix[len1][len2];
}

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
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

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  const lengthRatio = minLen / maxLen;
  if (lengthRatio < 0.3 && minLen < 4) {
    return 0;
  }

<<<<<<< HEAD

  const distance = levenshteinDistance(s1, s2);
  let similarity = ((maxLen - distance) / maxLen) * 100;


=======
  const distance = levenshteinDistance(s1, s2);
  let similarity = ((maxLen - distance) / maxLen) * 100;

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  if (minLen >= 3 && (s1.includes(s2) || s2.includes(s1))) {
    const containmentBonus = (minLen / maxLen) * 25;
    similarity = Math.max(similarity, 50 + containmentBonus);
  }

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  const startLen = Math.min(4, minLen);
  if (startLen >= 3 && s1.substring(0, startLen) === s2.substring(0, startLen)) {
    similarity += 10;
  }

<<<<<<< HEAD

  return Math.min(100, similarity);
}


=======
  return Math.min(100, similarity);
}

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
let cardNamesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

/**
<<<<<<< HEAD
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
=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
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
<<<<<<< HEAD
    
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
=======

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
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
    cacheTimestamp = Date.now();
    return cardNamesCache;
  } catch (error) {
    console.error('Error getting card names:', error);
    return cardNamesCache || [];
  }
}

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
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

<<<<<<< HEAD

  const cardNames = await getAllCardNames();
  const sanitizedInput = input.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");


=======
  const cardNames = await getAllCardNames();
  const sanitizedInput = input.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  // Reject very short inputs that are unlikely to be card names
  if (sanitizedInput.length < 2) {
    return null;
  }

<<<<<<< HEAD

  let bestMatch = null;
  let bestSimilarity = 0;


=======
  let bestMatch = null;
  let bestSimilarity = 0;

>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  for (const cardName of cardNames) {
    const sanitizedCardName = cardName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
    const similarity = calculateSimilarity(sanitizedInput, sanitizedCardName);

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = cardName;
    }
  }

<<<<<<< HEAD

=======
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
  if (bestMatch && bestSimilarity >= threshold) {
    return bestMatch;
  }

<<<<<<< HEAD

  return null;
}



module.exports = {
  findClosestCardName,

  getAllCardNames,
  calculateSimilarity
};
=======
  return null;
}

module.exports = {
  findClosestCardName,
  getAllCardNames,
  calculateSimilarity
};
>>>>>>> e1f315d952bb3f70e6d52c104d61a5db9fcb58e9
