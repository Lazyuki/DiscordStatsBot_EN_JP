module.exports.alias = [
	'chlb',
	'channel-leaderboard'
];

module.exports.command = async (message, content, bot) => {
  let channel = message.channel;
  let dic = bot.server.channelLeaderboard(message);

  let msg = `In channel ${message.channel.name}\n`;
  for (var user in dic) {
    msg += (await bot.fetchUser(user)).username + ': ' + dic[user] + '\n';
  }
  channel.send(msg);
};
