module.exports = function task(bot) {
  bot.server.save(); // saves the state everyday
  bot.server.today = (bot.server.today + 1) % 31;
  for (var user in bot.server.users) {
    let res = bot.server.users[user].adjust(bot.server.today);
    if (res) {
      delete bot.server.users[user];
    }
  }

  setTimeout(() => {
    task(bot);
  }, 24*60*60*1000); // 24*60*60*1000 = a day
}
