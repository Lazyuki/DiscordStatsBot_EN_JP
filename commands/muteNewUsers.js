module.exports.name = 'muteNew';

module.exports.alias = ['mutenew'];

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help =
  ' Mute new users in text chat. Type the same command again to disable it. **Intended for raids**';
const mutedPerms = ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'];
const minPerms = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'];
const normalPerms = [
  'ADD_REACTIONS',
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'USE_EXTERNAL_EMOJIS',
  'CHANGE_NICKNAME',
];

module.exports.command = async (message, content, bot, server) => {
  let nu = server.guild.roles.cache.get('249695630606336000'); // New User
  if (nu.permissions.cache.has('SEND_MESSAGES')) {
    // Get rid of all permissions.
    nu.setPermissions(mutedPerms);
    server.guild.defaultRole.setPermissions(mutedPerms);
    message.channel.send(
      'New Users are now *muted*. YOU MUST type the same command again once the raid is over.'
    );
  } else {
    // restore the old state
    nu.setPermissions(normalPerms);
    server.guild.defaultRole.setPermissions(minPerms);
    message.channel.send('New Users are now *unmuted*.');
  }
};
