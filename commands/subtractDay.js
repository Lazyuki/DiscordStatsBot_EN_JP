module.exports.alias = [
  'subtractDay',
  'subtractday',
  'minusDay'
];

module.exports.command = (message, content, bot) => {
  if (message.author.id != bot.owner_ID) return;
  bot.server.today = (bot.server.today - 1) % 31;
  message.channel.send(`Day is now ${bot.server.today}`);
};
