module.exports.alias = [
	'hide'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let chan = bot.server.guild.channels.get(content);
  if (chan) {
		if (bot.server.hiddenChannels.includes(content)) {
			message.channel.send(`#${chan.name} is already hidden.`);
			return;
		}
		bot.server.hideChannel(content);
		message.channel.send(`#${chan.name} is hidden now.`)
	}
};
