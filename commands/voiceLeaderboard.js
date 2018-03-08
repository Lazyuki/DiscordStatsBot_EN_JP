const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'voiceLeaderboard';

module.exports.alias = [
  'vc',
  'v'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,v [username (default = invoker)]` Voice leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let u = content == '' ? message.author : Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  var memberID = u.id;

  let users = server.users;
  let result = new BST();
  for (let user in users) {
    let res = users[user].voiceTime();
    if (res != 0) {
      result.add(user, res);
    }
  }
  result = result.toMap();
  let embed = new Discord.RichEmbed();
  embed.title = 'Voice Leaderboard';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let count = 1;
  let found = false;	

  for (let user in result) {
    let hours = Math.floor(result[user] / 60); 
    let vcTime = `${hours ? hours + 'hr '  : ''}${result[user] % 60}min`;
    if (count >= 25) { // the 25th person is either the 25th one or the user
      if (!found) {
        count++;
        if (user != memberID) continue;
      }
      embed.addField(count + ') ' + (await bot.fetchUser(user)).username, vcTime, true);
      break;
    }
    let us = await bot.fetchUser(user);
    if (!us) continue;
    if (user == memberID) found = true;
    embed.addField(count++ + ') ' + us.username, vcTime, true);
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  channel.send({embed});
};
