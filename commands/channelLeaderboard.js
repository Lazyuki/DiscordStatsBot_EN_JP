const Discord = require('discord.js');
const BST = require('../BST.js');

module.exports.alias = [
	'chlb',
	'channel-leaderboard'
];

module.exports.command = async (message, content, bot) => {
  let channel = message.channel;
  var chlb = message.channel;
  if (content != '') {
    chlb = bot.guilds.get('189571157446492161').channels.get(content);
  }
  //let result = bot.server.channelLeaderboard(message, content, bot);

  let users = bot.server.users;
  var result = new BST();
  let chan = content == '' ? message.channel.id : content;
  for (var user in users) {
    let res = users[user].channelStats(chan);
    if (res != 0) {
      result.add(user, res);
    }
  }
  result = result.toMap();

  let embed = new Discord.RichEmbed();
	embed.title = `Channel-Leaderboard for #${chlb.name}`;
  embed.description = 'For the last 30 days (UTC time)'
	embed.color = Number('0x3A8EDB');
  var count = 0;
  for (var user in result) {
		count++;
		embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user], true)
		if (count >= 25) break;
  }
  channel.send({embed});
};
