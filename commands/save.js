module.exports.alias = [
	'save'
];

module.exports.command = (message, _, bot) => {
	for (var s in bot.servers) {
    bot.servers[s].save();
  }
};
