const Discord = require('discord.js');
module.exports.alias = [
	'chlb',
	'channel-leaderboard'
];

module.exports.command = async (message, content, bot) => {
  let channel = message.channel;
  var chlb = message.channel;
  if (content != '') {
    chlb = bot.server.server.channels.get(content);
  }
  let dic = bot.server.channelLeaderboard(message, content, bot);
  let embed = new Discord.RichEmbed();
	embed.title = `Channel-Leaderboard for #${chlb.name}`;
  embed.description = 'For the last 30 days'
	embed.color = Number('0x3A8EDB');
  var count = 0;
  for (var user in dic) {
		count++;
		embed.addField(count + ') ' + (await bot.fetchUser(user)).username, dic[user], true)
		if (count >= 25) break;
  }
  channel.send({embed});
};
