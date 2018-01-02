module.exports.name = 'setPrefix';

module.exports.alias = [
  'prefix'
];

module.exports.initialize = (json, server) => {
  server.prefix = ',';
  if (!json || !json['prefix']) return;
  server.prefix = json['prefix'];
};

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Sets the bot\'s prefix';

module.exports.command = (message, content, bot, server) => {
  if (content.length > 0) {
    server.prefix = content;
    message.channel.send(`The new prefix is ${content}`);
  }
};
