module.exports.name = 'voiceKick';
module.exports.alias = ['voicekick', 'vk'];
module.exports.isAllowed = async () => {
  return true;
};

module.exports.help =
  'Kick yourself from a voice channel in N minutes. `,vk [number of minutes]`\nOr for mods, kick someone instantly `,vk <@someone>`';

async function removeFromVoice(members) {
  for (let member of members) {
    if (!member || !member.voiceChannel) continue;
    await member.setVoiceChannel(null);
  }
}
module.exports.command = async (message, content) => {
  if (!message.guild.me.hasPermission('MOVE_MEMBERS')) {
    message.channel.send('I need the "Move Members" permission.');
    return;
  }
  let mentions = message.mentions.members;
  if (mentions.size) {
    if (message.member.hasPermission('MUTE_MEMBERS')) {
      await removeFromVoice(mentions.array());
    } else {
      message.channel.send('You cannot kick others');
    }
    return;
  }
  if (!message.member.voiceChannel) {
    message.channel.send('You need to be in a voice channel');
    return;
  }
  let minutes = parseInt(content);
  if (isNaN(minutes) || minutes > 1440 || minutes < 0) minutes = 0;
  message.channel.send(`Kicking you from vc in ${minutes} minutes`);
  setTimeout(() => {
    removeFromVoice([message.member]);
  }, minutes * 60 * 1000);
};
