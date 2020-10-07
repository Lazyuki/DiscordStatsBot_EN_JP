module.exports.name = 'voiceMute';
module.exports.alias = ['voicemute', 'vm'];

const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false; // Only in EJLX
  return message.member.hasPermission('MUTE_MEMBERS');
};

module.exports.help = 'Voice mutes people. `,vm <@mentions> [reason]`';

module.exports.command = async (message, content, bot, server) => {
  content = content.replace(Util.REGEX_USER, '').trim();
  const targets = [...message.mentions.members.values()];
  const ids = content.match(Util.REGEX_RAW_ID);
  if (ids) {
    for (const id of ids) {
      const mem = server.guild.member(id);
      if (mem) {
        targets.push(mem);
      }
    }
    content = content.replace(Util.REGEX_RAW_ID, '').trim();
  }

  if (targets.size === 0) {
    message.channel.send('You must mention them');
    return;
  }
  let reason = content;
  if (!reason) {
    reason = 'unspecified';
  }
  const AGT = server.guild.channels.cache.get('755269708579733626');
  for (const member of targets) {
    if (member.voice.channel) {
      await member.setVoiceChannel(null);
    }
    await member.roles.add('357687893566947329'); // Voice mute role
    let embed = new Discord.MessageEmbed();
    embed.title = `You have been voice muted in the English-Japanese Language Exchange server`;
    embed.description = `Reason: ${reason}`;
    embed.setFooter('Contact the DM Bot if you need to discuss this issue.');
    embed.color = Number('0xEC891D');
    embed.timestamp = new Date();
    await member.send({ embed });
    embed = new Discord.MessageEmbed();
    embed.setAuthor(
      `${member.user.tag} has been muted in voice chat`,
      member.user.avatarURL()
    );
    embed.description = `Reason: ${reason}`;
    embed.color = Number('0xEC891D');
    embed.setFooter(`by ${message.author.tag}`, message.author.avatarURL());
    embed.timestamp = new Date();
    AGT.send({ embed });
    const warning = {
      issued: message.createdTimestamp,
      issuer: message.author.id,
      link: message.url,
      warnMessage: 'Voice muted',
    };
    if (server.warnlist[member.id]) {
      server.warnlist[member.id].push(warning);
    } else {
      server.warnlist[member.id] = [warning];
    }
  }
  message.channel.send('✅ Voice Muted');
};
