const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'leaderboard-test';

module.exports.alias = [
  'l-test'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;

};

module.exports.help = '`,l [username (default = invoker)]` Leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let u = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  let memberID = u.id;
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
  embed.title = 'Leaderboard';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let foundRank = false;	

  for (let i in result) {
    let [key, val] = result[i];
    let rank = i + 1;
    if (rank >= 25) { // the 25th person is either the 25th one or the user
      if (!foundRank && key != memberID) {
        continue;
      } else {
        embed.addField(rank + ') ' + (await bot.fetchUser(key)).username, val, true);
        break;
      }
    } else {
      let user = await bot.fetchUser(key);
      if (!user) continue;
      if (key == memberID) foundRank = i;
      embed.addField(rank + ') ' + user.username, val, true);
    }
  }
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  Util.paginate(await channel.send({embed}), embed, result, message.author.id, foundRank, bot);
};
