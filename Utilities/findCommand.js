const { findClosestCardName } = require("./spellChecker");
const sanitizeCommandName = require("./sanitizeCommandName");

/**
 * @description Finds a command by name or alias, with fuzzy matching for card names
 * @param {Object} client - The Discord client object
 * @param {string} commandText - The command text to find
 * @returns {Object|null} - The found command object or null if not found
 **/
async function findCommand(client, commandText) {
    const invoked = commandText.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
    let command = client.commands.get(invoked) || client.commands.find((a) => a.aliases?.includes(invoked));

    if (!command) {
        const originalInput = commandText.toLowerCase();
        let closestCardName = await findClosestCardName(originalInput, 70);
        if (!closestCardName) {
            closestCardName = await findClosestCardName(originalInput, 60);
        }
        if (closestCardName) {
            const sanitizedCardName = sanitizeCommandName(closestCardName);
            command = client.commands.get(sanitizedCardName) || client.commands.find((a) => a.aliases?.includes(sanitizedCardName));
        }
    }
    
    return command;
}
module.exports = findCommand;