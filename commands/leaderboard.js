const Discord = require('discord.js');
const BST = require('../BST.js');

module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = async (message, _, bot) => {
  let channel = message.channel;
  // let result = bot.server.leaderboard(message);

	let users = bot.server.users;
	var result = new BST();
	for (var user in users) {
		let res = users[user].totalStats();
		if (res != 0) {
			result.add(user, res);
		}
	}
	result = result.toMap();

  let embed = new Discord.RichEmbed();
	embed.title = 'Leaderboard';
	embed.description = 'For the last 30 days (UTC time)';
	embed.color = Number('0x3A8EDB');
	var count = 0;
  for (var user in result) {
		count++;
		embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user], true)
		if (count >= 25) break;
  }
  channel.send({embed});
};
