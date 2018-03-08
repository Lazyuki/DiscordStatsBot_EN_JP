const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'userToString';
module.exports.alias = [
  'ustr'
];
module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'JSON representation of the user.';

module.exports.command = async (message, content, bot, server) => {
  if (message.author.id != bot.owner_ID) return;
  let user = content == '' ? message.author : Util.searchUser(message, content, server, bot);
  if (!user) {
    message.react('❓');
    return;
  }

  var record = server.users[user.id];
  let member = await server.guild.fetchMember(user);

  // the user hasn't sent anything in the past 30 days
  if (record == undefined) {
    let embed = new Discord.RichEmbed();
    embed.title = `Stats for ${user.username}`;
    embed.description = 'Hasn\'t said anything in the past 30 days'
    embed.color = Number('0x3A8EDB');
    if (member) { // ban check
      embed.setFooter('Joined ');
      embed.timestamp = member.joinedAt;
    }
    message.channel.send({embed});
    return;
  }
  console.log(JSON.stringify(record));
  message.channel.send('done');
};
