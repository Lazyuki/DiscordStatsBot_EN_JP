module.exports.name = 'usernameChange';
module.exports.events = ['USER_UPDATE'];

module.exports.isAllowed = (userID, server) => {
  if (!server.guild.members.has(userID)) return;
  return server.guild.id == '189571157446492161';
};
const Discord = require('discord.js');

module.exports.process = async (oldUser, newUser, server) => {
  if (oldUser.tag != newUser.tag) {
    let embed = new Discord.RichEmbed();
    embed.description = `**${oldUser.tag}**'s username was changed to **${newUser.tag}**`;
    embed.color = Number('0x4286f4');
    embed.setFooter(`${newUser.username} (${newUser.id})`, newUser.avatarURL);
    embed.setTimestamp();
    server.guild.channels.get('277384105245802497').send({ embed });
  }
};
