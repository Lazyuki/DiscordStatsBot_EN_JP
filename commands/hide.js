module.exports.alias = [
	'hide'
];

module.exports.command = (message, content, bot) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  if (bot.server.server.channels.get(content)) bot.server.hideChannel(content);
};
