module.exports.alias = [
	'hidden'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  let arr = bot.server.getHiddenChannels();
	let s = '';
	for (var channel in arr) {
		s += `<#${channel}>\n`
	}
  message.channel.send(s);
};
