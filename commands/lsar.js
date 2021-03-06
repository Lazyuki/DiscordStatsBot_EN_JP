module.exports.name = 'listSelfAssignableRoles';

module.exports.alias = ['listsar', 'lsar'];

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR'); // Or Admins?
};

module.exports.help =
  ' List self-assignable roles where people can react to them to get the roles.';

module.exports.command = async (message, content, bot, server) => {
  if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
    message.channel.send('I need the Mangae Roles permission.');
    return;
  }
  let str = 'React with those emojis to toggle the roles.\n';
  let sortable = [];
  for (let emoji in server.sars) {
    let role = server.guild.roles.cache.get(server.sars[emoji]);
    if (!role) continue;
    sortable.push([role.name, emoji]);
  }
  // Sorts roles
  sortable.sort(function (a, b) {
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });
  for (let i in sortable) {
    str += `${sortable[i][1]} => **${sortable[i][0]}**\n`;
  }
  let msg = await message.channel.send(str);
  let nameRegex = /<a?:([\S]+):(\d+)>/;
  for (let i in sortable) {
    let emote = sortable[i][1];
    let regMatch = emote.match(nameRegex);
    if (regMatch) {
      emote = bot.emojis.cache.get(regMatch[2]);
    }
    try {
      await msg.react(emote);
    } catch (e) {
      message.channel.send('Reaction failed: ' + emote);
    }
  }
};
