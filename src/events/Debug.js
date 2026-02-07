const { Events } = require('discord.js');
module.exports = {
    name: Events.Debug,
    async run(stdout) {
         if (stdout.startsWith("Hit a 429")) {
        console.log("Rate limit reached. Retrying after some time...");
  }
}
}