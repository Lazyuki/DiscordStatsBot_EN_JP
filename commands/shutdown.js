module.exports.name = 'shutdown';

module.exports.alias = ['kill', 'shutdown'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help =
  '`,kill [False (if not saving the state)]` Shuts down the bot';

module.exports.command = (message, content, bot) => {
  for (var s in bot.servers) {
    let server = bot.servers[s];
    server.processors['VOICE'].forEach((p) => {
      p.end(server);
    });
    if (content.toLowerCase() != 'false') server.save();
  }
  console.log('Shutting down...');
  bot.destroy();
  setTimeout(process.exit, 0);
};
