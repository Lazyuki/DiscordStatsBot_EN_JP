module.exports.name = 'getRoleID';
module.exports.alias = [
  'roleid'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = 'get the role ID. `,roleid native`';

module.exports.command = (message, content, bot, server) => {
  content = content.toLowerCase();
  let s = '';
  for (let [, r] of server.guild.roles) {
    if (r.name.toLowerCase().startsWith(content)) {
      s += `${r.name} is \`<@&${r.id}>\`\n`;
    }
  }
  message.channel.send(s, { split: true });
};
