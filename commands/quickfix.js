module.exports.alias = [
	'kc'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	switch (content) {
		case 'list':
			message.channel.send(server.kanjis);
			break;
		default:
			server.kanjiCheck = !server.kanjiCheck;
			message.channel.send('done');
	}
};
