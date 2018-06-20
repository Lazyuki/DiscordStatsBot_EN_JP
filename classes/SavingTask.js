module.exports = function savingTask(bot) {
  for (let s in bot.servers) {
    bot.servers[s].save(false); // saves to the .restore.json
  }
};
