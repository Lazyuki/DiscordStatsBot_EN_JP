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
  message.channel.send('For the people that are fluent English: you will receive the role soon.');
  message.delete();
};
