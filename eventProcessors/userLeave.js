module.exports.name = 'userLeave';
module.exports.events = ['LEAVE'];
let EWBF = null;
module.exports.initialize = (json, server) => {
  if (server.guild.id == '189571157446492161') {
    EWBF = server.guild.channels.get('277384105245802497');
  }
};
module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');
function leaveNotif (member) {
  let embed = new Discord.RichEmbed();
  embed.description = `📤 **${member.user.tag}** has \`left\` the server. (${member.id})`;
  embed.setFooter(`User Leave (${member.guild.memberCount})`, member.user.avatarURL);
  embed.setTimestamp();
  embed.setColor(0xc13c35);
  return embed;
}
module.exports.process = async (member, server) => {
  if (server.tempvc[member.id]) delete server.tempvc[member.id];
  if (member.guild.id == '189571157446492161') {
    if (member.guild.members.get('270366726737231884').presence.status == 'offline') { // rybot
      let embed = leaveNotif(member);
      EWBF.send({embed});
    } else {
      setTimeout(async () => {
        let msgs = await EWBF.fetchMessages({limit: 30});
        for (let [, msg] of msgs) {
          if (msg.author.id == '270366726737231884' && msg.embeds.length && msg.embeds[0].description.includes(member.id)) return;
        }
        let embed = leaveNotif(member);
        EWBF.send({embed});
      }, 3000);
    }
  }
};
