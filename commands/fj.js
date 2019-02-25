module.exports.name = 'fj';
module.exports.alias = [
  'fj'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};

module.exports.help = '__WP only__ `,fj`';

module.exports.command = async (message) => {
  message.channel.send('You will be given the Fluent Japanese role when Native Japanese Welcoming Party member or Moderator feels you are fluent, they will also want to talk to you in voice chat first.');
  message.delete();
};
