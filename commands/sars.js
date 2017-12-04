module.exports.alias = [
	'sars',
	'sar',
	'lsar'
];

module.exports.command = async (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let str = 'React with those emojis to toggle the roles.\n'
	let sortable = [];
	for (let emoji in server.sars) {
		let role = server.guild.roles.get(server.sars[emoji]);
		if (!role) continue;
		sortable.push([role.name, emoji]);
	}
	// Sorts roles
	sortable.sort(function(a, b) {
			return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
	});
	for (let i in sortable) {
		str += `${sortable[i][1]} => **${sortable[i][0]}**\n`;
	}
	let msg = await message.channel.send(str);
	for (let i in sortable) {
		await msg.react(sortable[i][1]);
	}
};
