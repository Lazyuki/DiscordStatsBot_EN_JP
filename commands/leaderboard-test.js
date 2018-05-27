const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'leaderboard-test';

module.exports.alias = [
  'l-test'
];

module.exports.isAllowed = (message, server, bot) => {
  // return message.author.id == bot.owner_ID;
  return true;
};

module.exports.help = '`,l [username (default = invoker)]` Leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let searchUser = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!searchUser) {
    message.react('❓');
    return;
  }
  let users = server.users;
  let result = [];
  for (let user in users) {
    let res = users[user].totalStats();
    if (res != 0) {
      result.push([user, res]);
    }
  }
  result = result.sort((a,b) => {
    return b[1] - a[1];
  });
  let embed = new Discord.RichEmbed();
  embed.title = 'Leaderboard-test';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');

  let format = val => val;
  Util.userLeaderboard(message.channel, embed, result, message.author.id, searchUser, format, bot);
};
