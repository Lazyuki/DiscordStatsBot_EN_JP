const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'leaderboard';

module.exports.alias = [
  'leaderboard',
  'lb',  
  'l'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,l [username (default = invoker)]` Leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let u = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  var memberID = u.id;

  let users = server.users;
  let result = new BST();
  for (let user in users) {
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
  let count = 1;
  let found = false;	

  for (let user in result) {
    if (count >= 25) { // the 25th person is either the 25th one or the user
      if (!found && user != memberID) {
        count++;
        continue;
      }
      embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user], true);
      break;
    }
    let us = await bot.fetchUser(user);
    if (!us) continue;
    if (user == memberID) found = true;
    embed.addField(count++ + ') ' + us.username, result[user], true);
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  channel.send({embed});
};
