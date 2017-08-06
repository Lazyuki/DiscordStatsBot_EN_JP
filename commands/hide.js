module.exports.alias = [
	'hide'
];

module.exports.command = (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let chan = server.guild.channels.get(content);
  if (chan) {
		server.hideChannel(content);
		message.channel.send(`#${chan.name} is hidden now.`)
	} else if (message.mentions.channels.size != 0) {
		for (var [id, ch] of message.mentions.channels) {
			server.hideChannel(id);
			message.channel.send(`#${ch.name} is hidden now.`)
		}
	}
};
