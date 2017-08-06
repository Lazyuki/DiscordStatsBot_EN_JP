module.exports.alias = [
	'setgame'
];

module.exports.command = async (message, content, bot) => {
	await bot.setGame(content);
};
