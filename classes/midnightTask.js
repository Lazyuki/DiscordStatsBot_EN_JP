module.exports = function task(bot) {
  for (var sid in bot.servers) {
    let s = bot.servers[sid];
    s.save(true); // saves the state everyday
    s.today = (s.today + 1) % 31;
    for (var user in s.users) {
      let uRec = s.users[user];
      if (uRec.adjust(s.today)) {
        delete s.users[user];
      }
    }
  }

  setTimeout(() => {
    task(bot);
  }, 24*60*60*1000); // 24*60*60*1000 = a day
}
