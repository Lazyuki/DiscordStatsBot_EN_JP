module.exports.alias = [
	'setgame'
];

module.exports.command = async (message, content, bot) => {
  if (message.author.id != bot.owner_ID) return;
	await bot.user.setGame(content);
};
