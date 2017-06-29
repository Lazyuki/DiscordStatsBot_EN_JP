module.exports.alias = [
	'hidden'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  let arr = bot.server.ignoredChannels;
	let s = '';
	for (var index in arr) {
		if (!arr[index]) continue;
		s += `<#${arr[index]}>\n`;
	}
  message.channel.send(s);
};
