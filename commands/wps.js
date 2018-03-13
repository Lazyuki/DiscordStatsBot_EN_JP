module.exports.name = 'welcomingParties';
module.exports.alias = [
  'wp'
];

module.exports.isAllowed = (message, server) => {
  return true;
};

module.exports.help = 'Welcoming party stats';

module.exports.command = (message, content, bot, server) => {
  let wps = server.guild.members.filter((m) => {return m.roles.has('250907197075226625');});
  let str = '';
  for (let [id, wp] of wps) {
    if (server.users[id]) {
      str += `${wp.user.tag} : ${server.users[id].thirty}\n`;
    } else {
      str += `${wp.user.tag} : 0\n`;
    }
  }
  message.channel.send(str);
};
