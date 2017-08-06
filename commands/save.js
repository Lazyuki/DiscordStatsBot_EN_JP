module.exports.alias = [
	'save'
];

module.exports.command = (message, _, bot) => {
	if (message.author.id != bot.owner_ID) return;
	for (var s in bot.servers) {
    bot.servers[s].save();
  }
};
