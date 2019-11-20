const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'chatunmute';

module.exports.alias = [
  'chatunmute',
  'unmute'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161' && (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.has('543721608506900480'));
};

module.exports.help = '__Mods Only__ `,unmute <@mentions>`\n Unmute them. `,unmute @geralt`';

module.exports.command = async (message, content, bot, server) => {
  const goodPeople = message.mentions.members.array();

  for (let m of goodPeople) {
    m.roles.remove('259181555803619329', `Issued by: ${message.author.tag}`)
      .catch(e => {
        message.channel.send(`${m} wasn't muted.`);
      });
  }
  const ewbf = server.guild.channels.get('277384105245802497');
  let embed = new Discord.RichEmbed();
  let date = new Date();
  embed.setAuthor(`${message.author.tag}`,message.author.avatarURL);
  embed.title = 'Chat Unmute:';
  embed.addField('Unmuted users:', goodPeople.reduce((s, mem) => `${s}${mem}\n}`), false);
  embed.color = Number('0x53f442');
  embed.setFooter(`In #${message.channel.name}`);
  embed.timestamp = date;
  ewbf.send({embed});
  message.channel.send('✅ Unmuted');
};
