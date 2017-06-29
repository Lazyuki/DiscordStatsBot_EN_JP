module.exports.alias = [
	'save'
];

module.exports.command = async (message, _, bot) => {
  bot.server.save();
};
