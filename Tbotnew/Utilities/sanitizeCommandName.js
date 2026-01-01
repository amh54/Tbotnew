/**
* @description Sanitizes a string to be a valid Discord command name
* @param {string} s - The input string
* @return {string} - The sanitized command name
*/
function sanitizeCommandName(s) {
  const base =
    (s || "")
      .toString()
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "")
      .slice(0, 32) || "deck";
  return `${base}`;
}
module.exports = sanitizeCommandName;