const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'englishLeaderboard';

module.exports.alias = [
  'english-leaderboard',
  'enl'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '`,enl [username (default = invoker)] [-n number (default = 200)]` English Usage Leaderboard for this server.\ne.g. `,enl Geralt -n 500`';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let num = /-n (\d+)/.exec(content);
  if (num) {
    num = num[1];
    content = content.replace(/-n \d+/, '').trim();
  } else {
    num = 200;
  }
  let u = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  let memberID = u.id;

  let users = server.users;
  let result = new BST();
  for (let user in users) {
    let record = users[user];
    let total = record.totalStats();
    if (total >= num) {
      let mem = server.guild.members.get(user);
      if (!mem) {
        try {
          mem = await server.guild.member(user);
        } catch (e) {
          continue;
        }
      }
      if (mem.roles.has('196765998706196480')) {
        let enUsage = record.en / (record.jp + record.en) * 100;
        if (!enUsage) continue;
        result.add(user, enUsage);
      }
    }
  }
  result = result.toMap();
  let embed = new Discord.MessageEmbed();
  embed.title = 'English Usage Leaderboard';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let count = 1;
  let member = await server.guild.member(memberID);
  let found = !member.roles.has('196765998706196480');	

  for (let user in result) {
    if (count >= 25) { // the 25th person is either the 25th one or the user
      if (!found && user != memberID) {
        count++;
        continue;
      }
      embed.addField(count + ') ' + (await bot.users.fetch(user)).username, result[user].toFixed(2) + '%', true);
      break;
    }
    let us = await bot.users.fetch(user);
    if (!us) continue;
    if (user == memberID) found = true;
    embed.addField(count++ + ') ' + us.username, result[user].toFixed(2) + '%', true);
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  channel.send({embed});
};
