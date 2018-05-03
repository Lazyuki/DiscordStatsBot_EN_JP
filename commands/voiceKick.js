

module.exports.name = 'voiceKick';
module.exports.alias = [
  'voiceKick',
  'vk'
];
module.exports.isAllowed = async () => {
  return true;
};

module.exports.help = 'Kick yourself (someone) from a voice channel in N minutes. `,vk [number of minutes] [@mention (only mods)]`';


async function removeFromVoice(guild, members) {
  let newChan = await guild.createChannel('/dev/null', 'voice');
  for (let member of members) {
    member = await guild.fetchMember(member.user);
    if (!member.voiceChannel) return;
    await member.setVoiceChannel(newChan);
  }
  newChan.delete();
}
module.exports.command = async (message, content) => {
  if (!message.guild.me.hasPermission(['MANAGE_CHANNELS', 'MOVE_MEMBERS'])) {
    message.channel.send('I need the Mangae Channels and Move Members permissions.');
    return;
  }
  let mentions = message.mentions.members;
  if (mentions && message.member.hasPermission('MUTE_MEMBERS')) {
    removeFromVoice(message.guild, mentions.array());
    return;
  }
  let minutes = parseInt(content);  
  if (isNaN(minutes) || minutes > 1440 || minutes < 0) minutes = 0;
  message.channel.send(`Kicking you from vc in ${minutes} minutes`);
  setTimeout(() => {
    removeFromVoice(message.guild, [message.member]);
  }, minutes * 60 * 1000);
};
