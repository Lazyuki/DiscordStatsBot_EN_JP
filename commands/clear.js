module.exports.alias = [
	'clear',
  'clr'
];

module.exports.command = async (message, content, bot) => {
  let chan = message.channel;
	let messages = await chan.fetchMessages({limit : 20});
	for (var m in messages) {
		if (messages.get(m).author.id == bot.user.id) {
			messages.get(m).delete();
		}
	}
}
