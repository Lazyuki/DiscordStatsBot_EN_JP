const Discord = require('discord.js');
const BST = require('../BST.js');

module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = async (message, content, bot) => {
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
	var found = content == ''; // ID
	var twentyfive = true;

	var mems = bot.guilds.get('189571157446492161').members;
  for (var user in result) {
		count++; // counts banned people
		// use bot only method (fetchUser)? It would also show banned people.
		if (!found) {
			if (user == content) {
				found = true;
				if (!twentyfive) {
					embed.addField('__' + count + ') ' + mems.get(user).user.username + '__', result[user]);
					break;
				}
			}
		}
		if (mems.get(user) && twentyfive) { // if left, wont show up.

			embed.addField(count + ') ' + mems.get(user).user.username, result[user], true)
			if (count == 24) {
				if (found) break;
				twentyfive = false;
			}
		}
  }
  channel.send({embed});
};
