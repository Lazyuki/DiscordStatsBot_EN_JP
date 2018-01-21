module.exports.name = 'quickFix';
module.exports.alias = [
  'fix'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server    
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* hot fix';

module.exports.command = (message, content, bot, server) => {
  for (let id in server.users) {
    let user = server.users[id];
    let rec = user.record;
    for (let day in rec) {
      if (rec[day] && rec[day]['vc']) {
        delete server.users[id].record[day]['vc'];
      }
    }
  }
};
