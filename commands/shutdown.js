module.exports.alias = [
	'kill',
	'shutdown',
  'destroy',
	'sd'
];

module.exports.command = (message, _, bot) => {
	if (message.author.id != bot.owner_ID) return;
  console.log('Shutting down...');
  bot.destroy()
  setTimeout(process.exit, 0);
};
