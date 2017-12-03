const Discord = require('discord.js');

module.exports.alias = [
	'ping'
];

module.exports.command = (message, content, bot, server) => {
	let now = new Date().getTime();
	let date = Discord.SnowflakeUtil.deconstruct(message.id).date;
	message.channel.send(`${now - date.getTime())} ms`;
};
