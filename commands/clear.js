module.exports.alias = [
	'clear',
	'clean',
  'clr'
];

module.exports.command = async (message, content, bot) => {
  let chan = message.channel;
	var messages = await chan.fetchMessages({limit:20});
	for (var m of messages.values()) {
		if (m.author.id == bot.user.id) {
			m.delete();
		}
	}
};
