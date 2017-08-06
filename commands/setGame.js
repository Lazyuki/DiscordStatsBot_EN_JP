module.exports.alias = [
	'setgame'
];

module.exports.command = async (message, content, bot) => {
	await bot.user.setGame(content);
};
