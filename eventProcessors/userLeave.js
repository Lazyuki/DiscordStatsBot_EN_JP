module.exports.name = 'userLeave';
module.exports.events = ['LEAVE'];
let EWBF = null;
let DDJLog = null;
module.exports.initialize = (json, server) => {
  if (server.guild.id == '189571157446492161') {
    EWBF = server.guild.channels.get('277384105245802497');
  } else if (server.guild.id == '453115403829248010') {
    DDJLog = server.guild.channels.get('453125855523241984');
  }
};
module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');
function leaveNotif(member) {
  let embed = new Discord.RichEmbed();
  embed.description = `📤 **${member.user.tag}** has \`left\` the server. (${member.id})`;
  embed.setFooter(
    `User Leave (${member.guild.memberCount})`,
    member.user.avatarURL
  );
  embed.setTimestamp();
  embed.setColor(0xc13c35);
  return embed;
}
module.exports.process = async (member, server) => {
  if (server.tempvc[member.id]) delete server.tempvc[member.id];
  if (member.guild.id == '189571157446492161') {
    // react gone for new users
    const JHO = server.guild.channels.get('189571157446492161');
    if (server.newUsers.includes(member.id)) {
      let msgs = await JHO.fetchMessages();
      for (let [, msg] of msgs) {
        if (
          msg.author.id == '159985870458322944' &&
          msg.mentions.users.keyArray().includes(member.id)
        ) {
          // mee6
          msg.react('📤');
        }
      }
    }
    if (
      member.guild.members.get('270366726737231884').presence.status ==
      'offline'
    ) {
      // rybot
      let embed = leaveNotif(member);
      EWBF.send({ embed });
    } else {
      setTimeout(async () => {
        let msgs = await EWBF.fetchMessages({ limit: 20 });
        for (let [, msg] of msgs) {
          if (
            msg.author.id == '270366726737231884' &&
            msg.embeds.length &&
            msg.embeds[0].description.includes(member.id)
          )
            return;
        }
        let embed = leaveNotif(member);
        EWBF.send({ embed });
      }, 5000);
    }
  } else if (member.guild.id == '453115403829248010') {
    setTimeout(() => {
      let embed = leaveNotif(member);
      DDJLog.send({ embed });
    }, 500);
  }
};
