

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
  let newChan = await guild.createChannel('/dev/null', 'vioce');
  await member.setVoiceChannel(newChan);
  newChan.delete();
}
module.exports.command = async (message, content) => {

  let minutes = parseInt(content);  
  if (!minutes.isNaN()) {
    message.channel.send(`Kicking you from vc in ${minutes} minutes`);
  }
  setTimeout(() => {
    removeFromVoice(message.guild, message.member);
  }, minutes * 60 * 1000);
};
