const Discord = require('discord.js');
const BST = require('../BST.js');

module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = async (message, content, bot) => {
  let channel = message.channel;
  // let result = bot.server.leaderboard(message);

	var memberID = message.author.id;
	var mentions = message.mentions.members;
	if (mentions.size != 0) {
    memberID = mentions.firstKey();
  } else if (content != '') {
    if (bot.server.users[content]) { // TODO: check with name instead of ID
      user = bot.guilds.get('189571157446492161').members.get(content); // not good if banned
    } else {
      // User not found
    }
  }

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
	var found = false;
	var twentyfive = true;

  for (var user in result) {
		count++; // counts banned people
		// use bot only method (fetchUser)? It would also show banned people.
		if (count == 25) {
			if (found) {
				embed.addField(count + ') ' + bot.fetchUser(user).username, result[user], true);
				break;
			};
			twentyfive = false;
		}
		if (!found) {
			if (user == memberID) {
				found = true;
				if (!twentyfive) {
					embed.addField('__' + count + ') ' + bot.fetchUser(user).username + '__', result[user]);
					break;
				}
			}
		}
		if (twentyfive) { // if left, wont show up.
			embed.addField(count + ') ' + bot.fetchUser(user).username, result[user], true)
		}
  }
  channel.send({embed});
};
