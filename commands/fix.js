module.exports.alias = [
	'realfixSept6'
];

module.exports.command = (message, content, bot) => {
	if (message.author.id != bot.owner_ID) return;
	for (var user in bot.server.users) {
		let u = bot.server.users[user];
		var realJP = 0;
		for (var day in u.record) {
			if (u.record[day]['jpn']) {
				realJP += u.record[day]['jpn'];
			}
		}
		u.japanese = realJP;
	}
};
