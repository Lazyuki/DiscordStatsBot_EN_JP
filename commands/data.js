module.exports.alias = [
	'data'
];

module.exports.command = async (message, _, bot) => {
  var s = `Number of tracked users: ${Object.keys(bot.server.users).length}\n`;
  s += `Date number: ${bot.server.today}\n`;
  message.channel.send(s);
};
