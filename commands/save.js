module.exports.name = 'save';

module.exports.alias = [
  'save'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Save the server state.';

module.exports.command = (message, _, bot) => {
  if (message.author.id != bot.owner_ID) return;
  for (var s in bot.servers) {
    let server = bot.servers[s];
    server.save();
  }
};
