
/**
 * @description Generates a hash for a given row object
 * @param {object} row - The database row object
 * @return {string} - The generated hash
 */
function rowHash(row) {
  try {
    return require("crypto")
      .createHash("md5")
      .update(JSON.stringify(row))
      .digest("hex");
  } catch {
    return Date.now().toString();
  }
}
module.exports = rowHash;