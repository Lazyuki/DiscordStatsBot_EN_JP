module.exports.name = 'eval';

module.exports.alias = [
  'eval'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Eval. Can access (message, content, bot, server)';

module.exports.command = async (message, content, bot, server) => {
  eval(content);
};
