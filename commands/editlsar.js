module.exports.name = 'editListSelfAssignableRoles';

module.exports.alias = [
  'elsar'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server    
  return message.author.id == bot.owner_ID; // Or Admins?
};

module.exports.help = '__Mods Only__ Edit the list of self-assignable roles in #server_rules.';

module.exports.command = async (message, content, bot, server) => {
  let server_rules = server.guild.channels.get('189585230972190720');
  let msg = await server_rules.fetchMessage('387303122089017347');
  let str = 'React with those emojis to toggle the roles.\n';
  let sortable = [];
  for (let emoji in server.sars) {
    let role = server.guild.roles.get(server.sars[emoji]);
    if (!role) continue;
    sortable.push([role.name, emoji]);
  }
  // Sorts roles
  sortable.sort(function(a, b) {
    return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
  });
  for (let i in sortable) {
    str += `${sortable[i][1]} => **${sortable[i][0]}**\n`;
  }
  await msg.edit(str);
};
