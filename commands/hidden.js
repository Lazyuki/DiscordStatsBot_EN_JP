module.exports.alias = [
	'hidden'
];

module.exports.command = (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	if (!server.hiddenChannels.includes(message.channel.id)) return;
  let arr = server.hiddenChannels;
	let s = '';
	for (var index in arr) {
		if (!arr[index]) continue; // undefined
		s += `<#${arr[index]}>\n`;
	}
  message.channel.send(s);
};
