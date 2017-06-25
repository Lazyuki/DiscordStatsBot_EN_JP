module.exports.alias = [
	'kill',
	'shutdown',
  'destroy',
	'sd'
];

module.exports.command = (message, _, bot) => {
  console.log('Shutting down...');
  bot.destroy()
  setTimeout(process.exit, 0);
};
