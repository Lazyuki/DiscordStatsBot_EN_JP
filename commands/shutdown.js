module.exports.alias = [
	'kill',
	'shutdown',
  'destroy'
];

module.exports.command = (message, null, bot) => {
  message.channel.send('bye...');
  console.log('Shutting down...');
  setTimeout(bot.destroy(), 0);
  setTimeout(process.exit(0), 0);
};
