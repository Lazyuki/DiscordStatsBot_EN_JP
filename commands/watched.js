module.exports.name = 'watched';
module.exports.alias = [
  'watched',
  'watchlist'
];
module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Shows users on the watchlist.';

module.exports.command = async (message, content, bot, server) => {
  let res = `Watched users (${server.watchedUsers.length}):\n`;
  res += server.watchedUsers.map(u => `<@${u}>`).join(', ');
  message.channel.send(res, {split: { maxLength: 1950, char: ',' }});
};
