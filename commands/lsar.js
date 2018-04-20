module.exports.name = 'listSelfAssignableRoles';

module.exports.alias = [
  'listsar',
  'lsar'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.member.hasPermission('ADMINISTRATOR'); // Or Admins?
};

module.exports.help = '__Owner Only__ List self-assignable roles where people can react to them to get the roles.';

module.exports.command = async (message, content, bot, server) => {
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
  let msg = await message.channel.send(str);
  for (let i in sortable) {
    try {
      await msg.react(sortable[i][1]);      
    } catch (e) {
      message.channel.send('Reaction failed');
    }
  }
};
