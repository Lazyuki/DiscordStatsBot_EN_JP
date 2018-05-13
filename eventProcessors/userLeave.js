module.exports.name = 'userLeave';
module.exports.events = ['LEAVE'];

module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');

module.exports.process = async (member, server) => {
  if (server.tempvc[member.id]) delete server.tempvc[member.id];
  if (member.guild.id == '189571157446492161') {
    if (member.guild.members.get('270366726737231884').presence.status == 'offline') { // rybot
      let embed = new Discord.RichEmbed();
      embed.description = `📤**${member.user.tag}** has \`left\` the server. (${member.id})`;
      embed.setFooter(`User Leave (${member.guild.memberCount})`, member.user.avatarURL);
      embed.setTimestamp();
      embed.setColor(0xc13c35);
      member.guild.channels.get('277384105245802497').send({embed});
    } 
  }
};
