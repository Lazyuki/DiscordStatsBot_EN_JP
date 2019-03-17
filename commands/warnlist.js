const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'warnlist';
module.exports.alias = [
  'warnlist'
];

module.exports.isAllowed = async (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Warnings for the user `,warnlist <User>`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }

  let userID;
  let mentions = message.mentions.users;
  if (mentions.size != 0) {
    userID = mentions.first().id;
  } else {
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (idMatch) {
      userID = idMatch[1];
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
    embed.description = `${warnings.length} warnings so far`;
    embed.color = Number('0xDB3C3C');
    for (let { issued, issuer, warnMessage } of warnings) {
      const issuerMember = await server.guild.member(issuer);
      embed.addField(`${issuerMember ? issuerMember.user.tag : issuer } warned at ${new Date(issued)}`, warnMessage, false);
    } 
    message.channel.send({ embed })
  } else {
    message.channel.send('No warnings found');
  }
};
