module.exports.alias = [
	'fix'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	for (var user in server.users) {
		let u = server.users[user];
		var count = 0;
		for (var ch in u.chans) {
			if (u.chans[ch] == null) {
				delete server.users[user].chans[ch];
				count++;
			}
		}
	}
	message.channel.send(count);
};
