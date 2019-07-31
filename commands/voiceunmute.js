module.exports.name = 'voiceUnmute';
module.exports.alias = [
  'voiceunmute',
  'vum'
];

module.exports.initialize = (json, server) => {
  server.unmuteQ = [];
  if (!json || !json['unmuteQ']) return;
  server.unmuteQ = json['unmuteQ']; // server unmute them once they join
};

const Discord = require('discord.js');

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false; // Only in EJLX
  return message.member.hasPermission('MUTE_MEMBERS');
};

module.exports.help = '__VW Only__ Unmutes people. `,vum <@someone> [@sometwo ...]`';

module.exports.command = async (message, content, bot, server) => {
  let targets = message.mentions.members;
  for (let [ , member] of targets) {
    if (member.voice) {
      await member.voice.setMute(false, `by ${message.author.tag}`);
      if (member.voice.serverMute && !server.unmuteQ.includes(member.id)) {
        server.unmuteQ.push(member.id);
      }
    }
    await member.roles.remove('357687893566947329');
    const ewbf = server.guild.channels.get('277384105245802497');
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(`${member.user.tag} has been unmuted in voice chat` , member.user.avatarURL);
    embed.color = Number('0x5EE07A');
    embed.setFooter(`by ${message.author.tag}`, message.author.avatarURL);
    embed.timestamp = new Date();
    ewbf.send({embed});
  }
  message.channel.send('✅ Voice Unmuted');

};
