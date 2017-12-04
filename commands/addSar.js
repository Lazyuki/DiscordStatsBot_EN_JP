const Util = require('../classes/Util.js')
const Discord = require('discord.js')

module.exports.alias = [
	'addsar',
	'asar'
];

module.exports.command = (message, content, bot, server) => {
	if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let emoji = /^(\S+)\s/.exec(content)[1];
	if (!emoji) {
		message.channel.send('It should be \`,asar <emoji> <role name>');
		return;
	}
	if (server.sars[emoji]) {
		message.channel.send('Already assigned');
		return;
	};
	let rolename = /^\S+\s(.+)/.exec(content)[1];
	console.log(emoji)
	console.log(rolename);
	let regex = new RegExp(rolename, 'i');
	for (let [id, r] of server.guild.roles) {
		console.log(r.name)
		if (regex.test(r.name)) {
			server.sars[emoji] = r.id;
			message.channel.send(`${emoji} assigned to ${r.name}`);
			return;
		}
	}
	message.channel.send(`No role that matches \`${rolename}\` found`)
};
