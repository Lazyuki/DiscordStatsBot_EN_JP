const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const channelregex = /<#\d+>/g;
const Util = require('../classes/Util.js');

module.exports.name = 'channelLeaderboard-test';

module.exports.alias = [
  'chlb-test'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,chlb [#channel] [#2nd_channel] [#3rd... [username | @mention]` Leaderboard for channels. Defaults to the current channel if nothing is specified.';

module.exports.command = async (message, content, bot, server) => {
  let ch = message.channel;
  let channels = null;
  if (message.mentions.channels.size == 0) {
    channels = [ch];
  } else {
    channels = Array.from(message.mentions.channels.values());
  }
  content = content.replace(channelregex, '').trim();
  let searchUser = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!searchUser) {
    message.react('❓');
    return;
  }
  let users = server.users;
  let result = [];
  for (let user in users) {
    let count = 0;
    for (let chan of channels) {
      count += users[user].channelStats(chan.id);
    }
    if (count != 0) {
      result.push([user, count]);
    }
  }
  result = result.sort((a,b) => {
    return b[1] - a[1];
  });
  let chanNames = '';
  for (let chan of channels) {
    chanNames += `#${chan.name} `;
  }
  let embed = new Discord.RichEmbed();
  embed.title = `Channel-Leaderboard-test for ${chanNames}`.substr(0, 256);
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let format = val => val;
  Util.userLeaderboard(message.channel, embed, result, message.author.id, searchUser, format, bot);	
};
