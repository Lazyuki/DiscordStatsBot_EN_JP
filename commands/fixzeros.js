module.exports.alias = [
	'fixzeros'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	for (var user in server.users) {
		let u = server.users[user];
		for (var day in u.record) {
			if (u.record[day]) {
				for (var ch in u.record[day]) {
					if (u.record[day][ch] == 0) {
						delete server.users[user].record[day][ch];
					}
				}
			}
		}
		for (var ch in u.chans) {
			if (u.chans[ch] == null) {
				delete server.users[user].chans[ch];
			}
		}
	}
	message.channel.send('done');
};
