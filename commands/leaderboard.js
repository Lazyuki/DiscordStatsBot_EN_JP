const Discord = require('discord.js');

module.exports.alias = [
	'lb',
	'leaderboard'
];

module.exports.command = async (message, _, bot) => {
  let channel = message.channel;
  let dic = bot.server.leaderboard(message);

  let embed = new Discord.RichEmbed();
	embed.title = 'Leaderboard';
	embed.description = 'For the last 30 days';
	embed.color = Number('0x3A8EDB');
	var count = 0;
  for (var user in dic) {
		count++;
		embed.addField(count + ') ' + (await bot.fetchUser(user)).username, dic[user], true)
		if (count >= 25) break;
  }
  channel.send({embed});
};
