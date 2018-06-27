const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const channelregex = /<#\d+>/g;
const Util = require('../classes/Util.js');

module.exports.name = 'channelLeaderboard';

module.exports.alias = [
  'channel-leaderboard',  
  'chlb',
  'c'
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
  let u = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  let memberID = u.id;
  let users = server.users;
  let result = new BST();

  for (let user in users) {
    let count = 0;
    for (let chan of channels) {
      count += users[user].channelStats(chan.id);
    }
    if (count != 0) {
      result.add(user, count);
    }
  }
  result = result.toMap();

  let chanNames = '';
  for (let chan of channels) {
    chanNames += `#${chan.name} `;
  }
  let embed = new Discord.MessageEmbed();
  embed.title = `Channel-Leaderboard for ${chanNames}`.substr(0, 256);
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let count = 1;
  let found = false;

  for (let user in result) {
    if (count >= 25) { // the 25th person is either the 25th one or the user
      if (!found && user != memberID) {
        count++;
        continue;
      }
      embed.addField(count + ') ' + (await bot.users.fetch(user)).username, result[user], true);
      break;
    }
    let us = await bot.users.fetch(user);
    if (!us) continue;
    if (user == memberID) found = true;
    embed.addField(count++ + ') ' + us.username, result[user], true);
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  ch.send({embed});
};
