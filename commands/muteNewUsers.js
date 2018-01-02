module.exports.name = 'muteNew';

module.exports.alias = [
  'mutenew'
];

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;  
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '*Mods only* Mutes new users in text chat. Type the same command again to disable it. **Intended for raids**';

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  let nu = server.guild.roles.get('249695630606336000'); // New User
  if (nu.hasPermission('SEND_MESSAGES')) { // Get rid of all permissions.
    nu.setPermissions(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']);
    server.guild.defaultRole.setPermissions(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']);
    message.channel.send('New Users are now *muted*. Please type the same command again once the raid is over.');
  } else { // restore the old state
    nu.setPermissions(['ADD_REACTIONS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES',
      'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'CHANGE_NICKNAME']);
    server.guild.defaultRole.setPermissions(['ADD_REACTIONS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES',
      'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'CHANGE_NICKNAME']);
    message.channel.send('New Users are now *unmuted*.');
  }
};
