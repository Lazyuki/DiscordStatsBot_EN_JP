module.exports.alias = [
	'hide'
];

module.exports.command = (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let chan = server.guild.channels.get(content);
  if (chan) {
		if (~server.hiddenChannels.indexOf(content)) return;
		server.hiddenChannels.push(channel);
		message.channel.send(`#${chan.name} is hidden now.`)
	} else if (message.mentions.channels.size != 0) {
		for (var [id, ch] of message.mentions.channels) {
			if (~server.hiddenChannels.indexOf(id)) return;
			server.hiddenChannels.push(id);
			message.channel.send(`#${ch.name} is hidden now.`)
		}
	}
};
