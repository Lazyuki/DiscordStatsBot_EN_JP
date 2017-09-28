module.exports.alias = [
	'clear',
	'clean',
  'clr',
	'del'
];

module.exports.command = async (message, content, bot) => {
  let chan = message.channel;
	var messages = await chan.fetchMessages({limit:30});
	var deleteCount = parseInt(content);
	if (!deleteCount) deleteCount = 1;
	for (var m of messages.values()) {
		if (m.author.id == bot.user.id) {
			m.delete();
			if (--deleteCount <= 0) break;
		}
	}
};
