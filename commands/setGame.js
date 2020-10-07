module.exports.name = 'setGame';

module.exports.alias = ['setgame'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Sets the bot\'s "playing" game section';

module.exports.command = (message, content, bot) => {
  bot.user.setPresence({ game: { name: content, type: 0 } });
};
