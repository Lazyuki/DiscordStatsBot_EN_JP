module.exports.name = 'welcomingParties';
module.exports.alias = ['wp'];

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};

module.exports.help = 'Welcoming party stats';

module.exports.command = (message, content, bot, server) => {
  const wps = server.guild.members.cache.filter((m) => {
    return m.roles.cache.has('250907197075226625');
  });
  let str = '';
  const sortedWps = new Map(
    [...wps.entries()].sort((a, b) => {
      const aNum = server.users[a[0]] ? server.users[a[0]].thirty : 0;
      const bNum = server.users[b[0]] ? server.users[b[0]].thirty : 0;
      return bNum - aNum;
    })
  );
  for (let [id, wp] of sortedWps) {
    if (server.users[id]) {
      str += `${wp.user.tag} : ${server.users[id].thirty}\n`;
    } else {
      str += `${wp.user.tag} : 0\n`;
    }
  }
  message.channel.send(str);
};
