module.exports.alias = [
	'data'
];

module.exports.command = (message, content, bot) => {
	if (message.author.id != bot.owner_ID) return;
  var s = `Number of tracked users: ${Object.keys(bot.server.users).length}\n`;
	var num = parseInt(content);
	if (!num) num = 0;
	var moreThan = 0;
	for (var user in bot.server.users) {
		if (bot.server.users[user].thirtyDays > num) moreThan++;
	}
	s += `${moreThan} people have talked more than ${num} messages.\n`;
  s += `Date number: ${bot.server.today}\n`;
	s += `UTC Time: ${new Date().toUTCString()}`;
  message.channel.send(s);
};
