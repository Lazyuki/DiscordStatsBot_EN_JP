module.exports.name = 'voiceping';

module.exports.alias = ['vp'];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '';

module.exports.command = () => {};

module.exports.isCirillaCommand = true;
