module.exports.alias = [
	'unhide'
];

module.exports.command = (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  let arr = server.hiddenChannels;
  var index = arr.indexOf(content);
  if (index == -1) return;
	arr.splice(index, 1);
  message.channel.send(`<#${content}> is no longer hidden`);
};
