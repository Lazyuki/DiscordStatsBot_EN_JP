module.exports.name = 'emojicredits';
module.exports.alias = ['emojicredits', 'ec'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,ec` some emoji credits';

module.exports.command = async (message) => {
  message.channel.send(
    'We use some amazing emojis from other servers. To see more, check out here:\n' +
      'Roo emojis: https://discord.com/invite/nNXn2FC\n' +
      'Potato emojis: https://discord.gg/tato\n' +
      'Blob emojis: https://blobs.gg/'
  );
  message.delete();
};
