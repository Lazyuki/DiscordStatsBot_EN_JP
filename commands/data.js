module.exports.alias = [
	'data'
];

function msToTime(duration) {
    var seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24)
				, days = parseInt((duration/(1000*60*60*24)));

    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

module.exports.command = (message, content, bot) => {
	if (message.author.id != bot.owner_ID) return;
	let uptime = msToTime(bot.uptime);
	let res = `Uptime: ${uptime}\n\n`;
	for (var s in bot.servers) {
		let server = bot.servers[s];
		res += `Server: ${server.guild.name}\n`
		res += `Number of tracked users: ${Object.keys(server.users).length}\n`;
		var num = parseInt(content);
		if (!num) num = 0;
		var moreThan = 0;
		for (var user in server.users) {
			if (server.users[user].thirty > num) moreThan++;
		}
		res += `${moreThan} people have talked more than ${num} messages.\n`;
		res += `Number of hidden channels: ${server.hiddenChannels.length}`
	  res += `Date number: ${server.today}\n\n`;
	}
	res += `UTC Time: ${new Date().toUTCString()}`;
  message.channel.send(res);
};
