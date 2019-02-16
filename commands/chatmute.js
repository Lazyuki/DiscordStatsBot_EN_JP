const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'chatmute';

module.exports.alias = [
  'chatmute',
  'mute'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161' && (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.has('543721608506900480'));
};

module.exports.help = '__Mods Only__ `,mute <@mentions> [minutes] [reason]`\n Mute them from text chat. `,mute @geralt 60 shut up`';

module.exports.command = async (message, content, bot, server) => {
  const badPeople = message.mentions.members.array();
  let reason = 'Unspecified';
  let minutes;
  if (!badPeople.length) {
    message.channel.send('You have to mention them.');
    return;
  }
  content = content.replace(Util.REGEX_USER, '').trim();

  if (content) {
    let min = parseInt(content.split(' ')[0]);
    if (min) {
      minutes = Math.min(min, 1440);
      let r = content.substr(content.split(' ')[0].length + 1);
      if (r) {
        reason = r;
      }
    } else {
      reason = content;
    }
  }
  for (let m of badPeople) {
    m.roles.add('259181555803619329', `Issued by: ${message.author.tag}`);
    m.send(`You have been muted from ${server.guild}\nReason: ${reason}`);
    if (minutes) {
      setTimeout(() => {
        m.roles.remove('259181555803619329');
      }, minutes * 60 * 1000);
    }
  }
  const ewbf = server.guild.channels.get('277384105245802497');
  let embed = new Discord.MessageEmbed();
  let date = new Date();
  embed.setAuthor(`${message.author.tag}`,message.author.avatarURL());
  embed.title = 'Chat Mute:';
  embed.addField('Muted users:', badPeople.reduce((s, mem) => `${s}${mem}\n}`), false);
  embed.addField('Muted for (minutes):', minutes || 'Indefinite', false);
  embed.addField('Muted reason:', reason, false);
  embed.color = Number('0xff283a');
  embed.setFooter(`In #${message.channel.name}`);
  embed.timestamp = date;
  ewbf.send({embed});
  message.channel.send('✅ Muted');
};
