module.exports.alias = [
	'clear',
  'clr'
];

module.exports.command = async (message, content, bot) => {
  let chan = message.channel;
	var messages = await chan.fetchMessages({limit:30});
	for (var m of messages.values()) {
		if (m.author.id == bot.user.id) {
			m.delete();
		}
	}
};
