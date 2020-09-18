module.exports.name = 'clear';

module.exports.alias = [
  'clear',
  'clr'
];

module.exports.isAllowed = (message) => {
  return message.channel.id !== '277384105245802497'; // ewbf
};

module.exports.help = '`,clr [number of messages to delete]` Clear messages by Ciri. Defaults to 1 message.';

module.exports.command = async (message, content, bot) => {
  let chan = message.channel;
  let messages = await chan.fetchMessages({limit:30});
  let deleteCount = parseInt(content);
  let messagesToDelete = [];
  if (!deleteCount) deleteCount = 1;
  for (let m of messages.values()) {
    if (m.author.id == bot.user.id) {
      messagesToDelete.push(m);
      if (--deleteCount <= 0) break;
    }
  }
  if (deleteCount > 0) return;
  if (messagesToDelete.length > 1) {
    message.channel.bulkDelete(messagesToDelete);
  } else {
    messagesToDelete[0].delete();
  }
  if (message.guild.me.hasPermission('MANAGE_MESSAGES')) {
    message.delete();
  }
};
