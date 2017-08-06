module.exports = function task(bot) {
  for (var sid in bot.servers) {
    let s = bot.servers[sid];
    s.save(true); // saves the state everyday
    s.today = (s.today + 1) % 31;
    let ejlx = s.guild.id == '189571157446492161';
    for (var user in s.users) {
      let uRec = s.users[user];
      let res = uRec.adjust(s.today);
      if (ejlx) uRec.jp -= uRec.jp / 31 // TODO delete on sept 6
      if (res) {
        delete uRec;
      }
    }
  }

  setTimeout(() => {
    task(bot);
  }, 24*60*60*1000); // 24*60*60*1000 = a day
}
