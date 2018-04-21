

module.exports.name = 'voiceLimit';
module.exports.alias = [
  'voiceLimit',
  'vl'
];
module.exports.isAllowed = async () => {
  return true;
};

module.exports.help = 'kick yourself from any voice channel in N minutes. `,vl <number of minutes>`';

async function removeFromVoice(guild, member) {
  member = await guild.fetchMember(member.user);
  if (!member.voiceChannel) return;
  let newChan = await guild.createChannel('/dev/null', 'voice');
  await member.setVoiceChannel(newChan);
  newChan.delete();
}
module.exports.command = async (message, content) => {
  if (!message.guild.me.hasPermission(['MANAGE_CHANNELS', 'MOVE_MEMBERS'])) {
    message.channel.send('I need the Mangae Channels and Move Members permissions.');
    return;
  }
  let minutes = parseInt(content);  
  if (!isNaN(minutes)) {
    message.channel.send(`Kicking you from vc in ${minutes} minutes`);
  }
  setTimeout(() => {
    removeFromVoice(message.guild, message.member);
  }, minutes * 60 * 1000);
};
