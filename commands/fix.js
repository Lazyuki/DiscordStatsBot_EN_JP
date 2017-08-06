module.exports.alias = [
	//'realfixSept6'
	'fix'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	// let server = bot.servers['189571157446492161'];
	// for (var user in server.users) {
	// 	let u = server.users[user];
	// 	var realJP = 0;
	// 	for (var day in u.record) {
	// 		if (u.record[day]['jpn']) {
	// 			realJP += u.record[day]['jpn'];
	// 		}
	// 	}
	// 	u.jp = realJP;
	// }
	let arr = server.hiddenChannels;
	let s = '';
	for (var index in arr) {
		if (!arr[index]) {
			server.hiddenChannels = arr.splice(index, 1);
			continue;
		} // undefined
		s += `<#${arr[index]}>\n`;
	}
	message.channel.send(s);
};
