module.exports.alias = [
	'delsar',
	'dsar'
];

module.exports.command = (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	if (server.sars[content]) {
		delete server.sars[content];
		message.channel.send(`Deleted \`${content}\`'s mapping'`);
		return;
	}
	message.channel.send(`Not found \`${content}\``)
};
