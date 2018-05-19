module.exports.name = 'editListSelfAssignableRoles';

module.exports.alias = [
  'elsar'
];

module.exports.isAllowed = (message, server, bot) => {
  // if (message.guild.id != '293787390710120449') return false;  // My server    
  return message.author.id == bot.owner_ID; // Or Admins?
};

module.exports.help = '__Mods Only__ Edit the list of self-assignable roles in #server_rules.';

module.exports.command = async (message, content, bot, server) => {
  let server_rules = server.guild.channels.get('189585230972190720');
  let msg = await server_rules.fetchMessage('439925866617634816');
  msg.edit(content); // USE str for auto change
};
