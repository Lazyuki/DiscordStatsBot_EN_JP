module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = (message, _, bot) => {
  let channel = message.channel;
  bot.server.stat(message);
};
