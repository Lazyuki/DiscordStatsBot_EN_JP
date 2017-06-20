module.exports.alias = [
	'kill',
	'shutdown',
  'destroy'
];

module.exports.command = (message, _, bot) => {
  console.log('Shutting down...');
  bot.destroy()
  setTimeout(process.exit, 0);
};
