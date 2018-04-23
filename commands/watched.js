module.exports.name = 'watched';
module.exports.alias = [
  'watched',
  'watchlist'
];
module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id) && message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = 'Shows users on the watchlist.';

module.exports.command = async (message, content, bot, server) => {
  let res = 'Watched users:\n';
  for (var i in server.watchedUsers) {
    res += '<@' + server.watchedUsers[i] + '>\n';
  }
  message.channel.send(res);
};
