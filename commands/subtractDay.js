module.exports.alias = [
  'subtractDay',
  'subtractday',
  'minusDay'
];

module.exports.command = (message, content, bot, server) => {
  if (message.author.id != bot.owner_ID) return;
  server.today = (server.today - 1) % 31;
  message.channel.send(`Day is now ${server.today}`);
};
