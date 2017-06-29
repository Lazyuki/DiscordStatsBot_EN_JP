module.exports.alias = [
	'hidden'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	if (!bot.server.hiddenChannels.includes(message.channel.id)) return;
  let arr = bot.server.hiddenChannels;
	let s = '';
	for (var index in arr) {
		if (!arr[index]) continue;
		s += `<#${arr[index]}>\n`;
	}
  message.channel.send(s);
};
