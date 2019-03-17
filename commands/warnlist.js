const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'warnlist';
module.exports.alias = [
  'warnlist',
  'warnlog'
];

module.exports.isAllowed = async (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Warnings for the user `,warnlist [User]`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    const warnings = server.warnlist;
    const list = [];
    for (let u of Object.keys(warnings)) {
      let warns = warnings[u].length;
      list.push(`<@${u}>: ${warns} warning${warns === 1 ? '' : 's'}`)
    }
    Util.paginate(message.channel, 'All warnings', list, 10, message.author.id)
    return;
  }

  let userID;
  let mentions = message.mentions.users;
  if (mentions.size != 0) {
    userID = mentions.first().id;
  } else {
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (idMatch) {
      userID = idMatch[0];
    }
  }

  if (!userID) {
    message.channel.send('Failed to get a user');
    return;
  };

  if (server.warnlist[userID]) {
    const warnings = server.warnlist[userID];
    const embed = new Discord.MessageEmbed();
    let member = await server.guild.member(userID);
    embed.title = `Warning list for ${member ? member.user.tag : userID}`;
    embed.color = Number('0xDB3C3C');
    for (let { issued, issuer, warnMessage } of warnings) {
      const issuerMember = await server.guild.member(issuer);
      embed.addField(`${new Date(issued).toGMTString()} by ${issuerMember ? issuerMember.user.tag : issuer }`, warnMessage, false);
    } 
    message.channel.send({ embed })
  } else {
    message.channel.send('No warnings found');
  }
};
