module.exports.alias = [
	'sars'
];

module.exports.command = (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let str = 'React with those emojis to toggle the role.\n'
	for (let emoji in server.sars) {
		let role = server.guild.roles.get(server.sars[emoji]);
		if (!role) continue;
		str += `${emoji} => **${role.name}**\n`
	}
	message.channel.send(str);
};
