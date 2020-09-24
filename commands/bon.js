module.exports.name = 'bon';
module.exports.alias = [
  'bon',
  'bonguide',
  'bonginnerplus'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,bon` Bonyari#8184\'s guide';
const Discord = require('discord.js');
const externalLink = '<:externallink:438354612379189268>';
const link = 'https://docs.google.com/document/d/19FEIOJWbLhJQ-AmepxFBMC2ebhJJr9RBUMfMeatYuq8/edit?usp=sharing';

module.exports.command = async (message, content, bot, server) => {
  message.delete();
  const embed = new Discord.RichEmbed();
  let bon;
  try {
    bon = await server.guild.fetchMember('149169203910279179');
  } catch (e) {
    console.log('failed to fetch bon');
  }

  embed.title = `**HOW TO LEARN JAPANESE EFFICIENTLY** ${externalLink}`;
  embed.url = link;
  embed.setFooter(`Written by ${bon.user.tag}`, bon ? bon.user.avatarURL : '');
  embed.color = 8843151;
  message.channel.send({embed});
};
