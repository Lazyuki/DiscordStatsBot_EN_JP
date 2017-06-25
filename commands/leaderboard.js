module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = async (message, _, bot) => {
  let channel = message.channel;
  let dic = bot.server.leaderboard(message);

  let msg = '';
  for (var user in dic) {
    msg += (await bot.fetchUser(user)).username + ': ' + dic[user] + '\n';
  }
  channel.send(msg);
};
