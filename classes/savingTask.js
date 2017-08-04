module.exports = function savingTask(bot) {
  bot.server.save(false); // saves to the .restore.json
  setTimeout(() => {
    savingTask(bot);
  }, 60*60*1000); // 60*60*1000 = every hour
}
