module.exports.name = 'poll';

module.exports.alias = ['poll'];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = '';

module.exports.command = () => {};

module.exports.isCirillaCommand = true;
