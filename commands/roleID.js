module.exports.name = 'getRoleID';
module.exports.alias = [
  'roleid'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* get role ID';

module.exports.command = (message, content, bot, server) => {
  for (let [, r] of server.guild.roles) {
    if (r.name.startsWith(content)) {
      message.channel.send(`ID for ${r.name} is ${r.id}`);
    }
  }
};
