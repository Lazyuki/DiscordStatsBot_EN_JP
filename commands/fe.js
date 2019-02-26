module.exports.name = 'fe';
module.exports.alias = [
  'fe'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};

module.exports.help = '__WP only__ `,fe`';


module.exports.command = async (message) => {
  message.channel.send('If you are fluent in English, expect to receive the role soon <:prettythumbsup:420455919596601356>');
  message.delete();
};
