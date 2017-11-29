const Discord = require('discord.js');
const BST = require('../classes/BST.js');

module.exports.alias = [
	'chlb',
	'channel-leaderboard',
  'c'
];

module.exports.command = async (message, content, bot, server) => {
  let sendChannel = message.channel;
  var chlb = message.channel;
  var chMentions = message.mentions.channels;
  if (chMentions.size != 0) {
    chlb = chMentions.get(chMentions.firstKey());
  } else if (content != '') {
    chlb = server.guild.channels.get(content);
    if (chlb == undefined) return; // invalid channel;
  }

  if (~server.hiddenChannels.indexOf(chlb.id)) { // It's a hidden channel
    if (!~server.hiddenChannels.indexOf(sendChannel.id)) {
      chlb = sendChannel;
    }
  }

  let users = server.users;
  var result = new BST();
  let channelID = chlb.id;
  for (var user in users) {
    let res = users[user].channelStats(channelID);
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
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  sendChannel.send({embed});
};
