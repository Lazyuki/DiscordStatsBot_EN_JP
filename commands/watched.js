module.exports.alias = [
	'watched',
	'watchlist'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  let res = 'Watched users:\n';
	for (var i in server.watchedUsers) {
		res += '<@' + server.watchedUsers[i] + '>\n';
	}
	message.channel.send(res);
};
