module.exports.name = 'unlockdown';

module.exports.alias = [
  'unlockdown'
];

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;  
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '__Mods Only__ End lockdown';


const normalPerms = ['ADD_REACTIONS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'CHANGE_NICKNAME'];

module.exports.command = async (message, content, bot, server) => {
  server.lockdown = null;
  JHO = server.guild.channels.get('189571157446492161');
  JHO.permissionOverwrites.get('159985870458322944').delete().catch(() => message.channel.send('Failed to delete MEE6 channel overwrites')); // Mee6
  JHO.permissionOverwrites.get('270366726737231884').delete().catch(() => message.channel.send('Failed to delete Rai channel overwrites')); // Rai
  message.channel.send('✅  Phew... Lockdown has been lifted. Please go to https://mee6.xyz/dashboard/189571157446492161/welcome and re-enable welcome message in jho');
};
