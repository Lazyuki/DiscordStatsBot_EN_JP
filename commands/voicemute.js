module.exports.name = 'voiceMute';
module.exports.alias = [
  'voicemute',
  'vm'
];

const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false; // Only in EJLX
  return message.member.hasPermission('MUTE_MEMBERS');
};

module.exports.help = '__VW Only__ Voice mutes people. `,vm <@someone> [@sometwo ...] [reason]`';

module.exports.command = async (message, content) => {
  let targets = message.mentions.members;
  let reason = content.replace(Util.REGEX_USER, '').trim();
  if (reason == ''){
    reason = 'unspecified';
  }
  for (let [ , member] of targets) {
    await member.setMute(true, `by ${message.author.tag} Reason: ${reason}` );
    await member.addRole('357687893566947329'); // Voice mute role
    let embed = new Discord.RichEmbed();
    embed.title = `You have been voice muted in the English-Japanese Language Exchange server by ${message.author.tag}`;
    embed.description = `Reason: ${reason}`;
    embed.color = Number('0xEC891D');
    embed.setFooter('Contact one of the mods if you need to discuss this issue.', message.author.avatarURL);
    embed.timestamp = new Date();
    await member.send({embed});
    embed = new Discord.RichEmbed();
    embed.setAuthor(`${member.user.tag} has been muted in voice chat` , member.user.avatarURL);
    embed.description = `Reason: ${reason}`;
    embed.color = Number('0xEC891D');
    embed.setFooter(`by ${message.author.tag}`, message.author.avatarURL);
    embed.timestamp = new Date();
    message.channel.send({embed});
  }
};
