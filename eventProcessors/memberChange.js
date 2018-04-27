module.exports.name = 'memberChange';
module.exports.events = ['MEMBER_UPDATE'];

module.exports.isAllowed = (memberID, server) => {
  return server.guild.id = '189571157446492161';
};
const Discord = require('discord.js');

module.exports.process = async (oldMember, newMember, server) => {
  if (oldMember.nickname != newMember.nickname) {
    let embed = new Discord.RichEmbed();
    if (!oldMember.nickname) {
      embed.title = `**${oldMember.user.username}**'s nickname was set to ${newMember.nickname}`;
    } else if (!newMember.nickname) {
      embed.title = `**${oldMember.nickname}**'s nickname was removed and now is ${newMember.user.username}`;
    } else {
      embed.title = `**${oldMember.nickname}**'s nickname was changed to ${newMember.nickname}`;
    }
    embed.color = Number('0x4286f4');
    embed.setFooter(newMember.id ,newMember.user.avatarURL);
    server.guild.channels.get('277384105245802497').send({embed});
  }
};