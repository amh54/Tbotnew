
/**
 * @description Generates a hash for a given row object
 * @param {object} row - The database row object
 * @return {string} - The generated hash
 */
function rowHash(row) {
  try {
    // Sort keys to ensure consistent hash regardless of property order
    const sortedRow = Object.keys(row)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = row[key];
        return acc;
      }, {});
    return require("node:crypto")
      .createHash("md5")
      .update(JSON.stringify(sortedRow))
      .digest("hex");
  } catch {
    return Date.now().toString();
  }
}
module.exports = rowHash;