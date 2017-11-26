const Discord = require('discord.js');

module.exports.alias = [
	'readme'
];

module.exports.command = (message) => {
	let embed = new Discord.RichEmbed();
	embed.title = '__**WELCOME!! :tada: READ ME!**__';
	embed.setImage('https://i.imgur.com/snInv3M.png');
	embed.addField('Ask Japanese Questions', '#japanese_questions', true);
	embed.addField('Beginner Japanese Chat', '#beginner_jpn_chat', true);
	embed.addField('Answer English Questions', '#english_questions', true);
	embed.addField('Language Exchange', '#language_exchange', true);
	embed.addField('Server Rules', 'Please read #server_rules for more info', true);
	embed.color = 16711935;
	message.channel.send({embed});
};
