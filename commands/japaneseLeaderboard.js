const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'japaneseLeaderboard';

module.exports.alias = [
  'japanese-leeaderboard',
  'jpl'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '`,jpl [username (default = invoker)] [-n number (default = 1000)]` Japanese Usage Leaderboard for this server.\ne.g. `,jpl Geralt -n 500`';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let num = /-n (\d+)/.exec(content);
  if (num) {
    num = num[1];
    content.replace(/-n \d+/, '');
  } else {
    num = 1000;
  }
  let u = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  var memberID = u.id;

  let users = server.users;
  let result = new BST();
  for (let user in users) {
    let record = users[user];
    try {
      let mem = await server.guild.fetchMember(user);
      if (!mem) continue;
      let total = record.totalStats();
      if (total >= num && !mem.roles.has('196765998706196480')) {
        let jpnUsage = (record.jp / (record.jp + record.en) * 100).toFixed(2);
        result.add(user, jpnUsage);
      }
    } catch (e) {
      continue; // member not in the server
    }
    
  }
  result = result.toMap();
  let embed = new Discord.RichEmbed();
  embed.title = 'Japanese Usage Leaderboard';
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
      embed.addField(count + ') ' + (await bot.fetchUser(user)).username, result[user] + '%', true);
      break;
    }
    let us = await bot.fetchUser(user);
    if (!us) continue;
    if (user == memberID) found = true;
    embed.addField(count++ + ') ' + us.username, result[user] + '%', true);
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  channel.send({embed});
};
