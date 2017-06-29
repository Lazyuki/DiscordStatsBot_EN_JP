module.exports.alias = [
	'save'
];

module.exports.command = (message, _, bot) => {
  bot.server.save();
};
