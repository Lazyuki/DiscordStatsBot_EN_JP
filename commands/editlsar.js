module.exports.name = 'editListSelfAssignableRoles';

module.exports.alias = [
  'elsar'
];

module.exports.isAllowed = (message) => {
  // if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.member.hasPermission('ADMINISTRATOR');
  // return message.author.id == bot.owner_ID; // Or Admins?
};

module.exports.help = '__Mods Only__ Edits the list of self-assignable roles in the lsar stickied channel. Checks for the last message sent by Ciri in the channel';

module.exports.command = async (message, content, bot, server) => {
  let stickiedChannel = server.guild.channels.get(server.sticky);
  if (!stickiedChannel) {
    message.channel.send('Cannot find the sticked channel. Try `,h sticky` first. ');
    return;
  }

  let msgs = await stickiedChannel.messages.fetch();
  let lsar = msgs.filter(msg => msg.author.id === bot.id).first();
  if (!lsar) {
    message.channel.send('Cannot find Ciri\'s message');
    return;
  }
  lsar.edit(content); // USE str for auto change
  message.channel.send('Message edited!');
};
