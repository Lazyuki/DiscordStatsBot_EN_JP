module.exports.alias = [
	'prune'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	var ids = content.split(' ');
	var lastMessageID = message.id;
	var done = false;
	var now = parseInt(message.id);
	var day = 24 * 60 * 60 * 1000;
	while (!done) {
		let messages = await message.channel.fetchMessages({limit: 100, before: lastMessageID});
		let delMsgs = [];
		for (var m of messages.values()) {
			if (now - parseInt(m.id) > day) {
				done = true;
				break;
			};
			lastMessageID = m.id;
			if (ids.indexOf(m.author.id) != -1) {
				delMsgs.push(m);
			}
		}
		message.channel.bulkDelete(delMsgs);
	}
	message.channel.send('done!');
};
