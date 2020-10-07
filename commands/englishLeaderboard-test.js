const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'englishLeaderboard-tets';

module.exports.alias = ['enl-test'];

module.exports.isAllowed = (message, server) => {
  return false;
};

module.exports.help =
  '`,enl [username (default = invoker)] [-n number (default = 200)]` English Usage Leaderboard for this server.\ne.g. `,enl Geralt -n 500`';

module.exports.command = async (message, content, bot, server) => {
  let num = /-n (\d+)/.exec(content);
  if (num) {
    num = num[1];
    content = content.replace(/-n \d+/, '').trim();
  } else {
    num = 200;
  }
  let searchUser =
    content == ''
      ? message.author
      : await Util.searchUser(message, content, server, bot);
  if (!searchUser) {
    message.react('❓');
    return;
  }
  let users = server.users;
  let result = [];
  for (let user in users) {
    let record = users[user];
    let total = record.totalStats();
    if (total >= num) {
      let mem = server.guild.members.get(user);
      if (!mem) {
        try {
          mem = await server.guild.member(user);
          if (!mem) continue;
        } catch (e) {
          continue;
        }
      }
      if (mem.roles.has('196765998706196480')) {
        let enUsage = (record.en / (record.jp + record.en)) * 100;
        if (!enUsage) continue;
        result.push([user, enUsage]);
      }
    }
  }
  result = result.sort((a, b) => {
    return b[1] - a[1];
  });
  let embed = new Discord.RichEmbed();
  embed.title = 'English Usage Leaderboard-test';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');

  let format = (val) => val.toFixed(2) + '%';
  Util.userLeaderboard(
    message.channel,
    embed,
    result,
    message.author.id,
    searchUser,
    format,
    bot
  );
};
