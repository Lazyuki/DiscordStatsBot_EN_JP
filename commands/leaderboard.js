const Discord = require('discord.js');
const BST = require('../BST.js');

module.exports.alias = [
	'lb',
	'leaderboard',
	'l'
];

module.exports.command = async (message, content, bot) => {
  let channel = message.channel;
  // let result = bot.server.leaderboard(message);

	var memberID = message.author.id;
	var mentions = message.mentions.members;
	if (mentions.size != 0) {
    memberID = mentions.firstKey();
  } else if (content != '') {
		content = content.toLowerCase();
    for (var id in bot.server.users) {
      let u = bot.server.guild.members.get(id);
			if (u == undefined) continue; // if banned
      if (u.user.username.toLowerCase().startsWith(content)
					|| u.displayName.toLowerCase().startsWith(content)) {
        memberID = id;
        break;
			}
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
	//var moreThan = 0;

  for (var user in result) {
		//if (result[user] > 10) moreThan++;
		count++; // counts banned people
		if (count == 25) {
			if (found) {
				embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user], true);
				break;
			};
			twentyfive = false;
		}
		if (!found) {
			if (user == memberID) {
				found = true;
				if (!twentyfive) {
					embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user]);
					break;
				}
			}
		}
		if (twentyfive) { // if left, wont show up.
			embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user], true)
		}
  }
	//console.log(moreThan);
	embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  channel.send({embed});
};
