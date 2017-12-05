module.exports.alias = [
	'addsar',
	'asar'
];

module.exports.command = (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let captured = /^(\S+)\s(.+)/i.exec(content);
	if (!captured) {
		message.channel.send('It should be \`,asar <emoji> <role name>\`');
		return;
	}
	let emoji = captured[1];
	let rolename = captured[2];
	if (server.sars[emoji]) {
		message.channel.send('Already assigned');
		return;
	};
	let regex = new RegExp(rolename, 'i');
	for (let [id, r] of server.guild.roles) {
		if (regex.test(r.name)) {
			server.sars[emoji] = r.id;
			message.channel.send(`${emoji} assigned to ${r.name}`);
			return;
		}
	}
	message.channel.send(`No role matched \`${rolename}\``)
};
