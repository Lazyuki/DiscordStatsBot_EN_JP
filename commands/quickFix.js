module.exports.name = 'quickFix';
module.exports.alias = [
  'fix'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server    
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* hot fix';

module.exports.command = (message, content, bot) => {
  for (let sid in bot.servers) {
    let server = bot.servers[sid];
    for (let id in server.users) {
      if (id == '408971129336758272') {
        delete server.users[id];
        continue;
      }
      let user = server.users[id];
      let rec = user.record;
      for (let day in rec) {
        if (day <= 4) {
          if (rec[day] && rec[day]['vc']) {
            let  v = server.users[id].record[day]['vc'];
            server.users[id].vc -= v;
            delete server.users[id].record[day]['vc'];
          }
        } else {
          break;
        }
      }
    }
  }

  message.channel.send('done');
};
