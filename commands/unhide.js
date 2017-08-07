module.exports.alias = [
	'unhide'
];

module.exports.command = (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let arr = server.hiddenChannels;
	let chan = server.guild.channels.get(content);
  if (chan) {
	  var index = arr.indexOf(content);
	  if (index == -1) return;
		arr.splice(index, 1);
	  message.channel.send(`<#${content}> is no longer hidden`);
	} else if (message.mentions.channels.size != 0) {
		for (var [id, ch] of message.mentions.channels) {
			var index = arr.indexOf(id);
		  if (index == -1) return;
			arr.splice(index, 1);
		  message.channel.send(`<#${id}> is no longer hidden`);
		}
	}
};
