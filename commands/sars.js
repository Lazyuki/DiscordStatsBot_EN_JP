module.exports.alias = [
	'sars'
];

module.exports.command = (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let str = 'React with those emojis to toggle the role.\n'
	let sortable = [];
	for (let emoji in server.sars) {
		let role = server.guild.roles.get(server.sars[emoji]);
		if (!role) continue;
		sortable.push([role.name, `${emoji} => **${role.name}**\n`]);
	}
	// Sorts the active channels
	sortable.sort(function(a, b) {
			return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
	});
	for (let i in sortable) {
		str += sortable[i][1];
	}
	message.channel.send(str);
};
