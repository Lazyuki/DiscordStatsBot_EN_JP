module.exports.name = 'quickFix';
module.exports.alias = [
  'fix'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server    
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* hot fix';

module.exports.command = (message, content, bot, server) => {
  let ignoreHidden = !server.hiddenChannels.includes(message.channel.id);
  for (let id in server.users) {
    let user = server.users[id];
    for (let ch in user.chans) {
      if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
      if (ch ==='13' || ch === 13) {
        delete server.users[id].chans[ch];
      }
    }
  }

  message.channel.send('done');
};