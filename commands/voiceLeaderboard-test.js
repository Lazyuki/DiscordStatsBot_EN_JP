const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'voiceLeaderboard-test';

module.exports.alias = [
  'vc-test'
];

module.exports.isAllowed = () => {
  return false;
};

module.exports.help = '`,v [username (default = invoker)]` Voice leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let searchUser = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!searchUser) {
    message.react('❓');
    return;
  }
  let users = server.users;
  let result = [];
  for (let user in users) {
    let res = users[user].voiceTime();
    if (res != 0) {
      result.push([user, res]);
    }
  }
  result = result.sort((a,b) => {
    return b[1] - a[1];
  });
  let embed = new Discord.MessageEmbed();
  embed.title = 'Voice Leaderboard-test';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let format = val => {
    let hours = Math.floor(val / 60); 
    return `${hours ? hours + 'hr '  : ''}${val % 60}min`;
  };
  Util.userLeaderboard(message.channel, embed, result, message.author.id, searchUser, format, bot);	
};
