module.exports.alias = [
	'hide'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let chan = bot.server.server.channels.get(content);
  if (chan) {
		bot.server.hideChannel(content);
		message.channel.send(`channel ID: ${chan.name} is hidden now.`)
	}
};
