module.exports.name = 'shutdown';

module.exports.alias = [
  'kill',
  'shutdown'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Shuts down the bot';

module.exports.command = (message, _, bot) => {
  console.log('Shutting down...');
  bot.destroy();
  setTimeout(process.exit, 0);
};
