const Discord = require('discord.js');

module.exports.alias = [
	'yonde'
];

module.exports.command = (message) => {
	let embed = new Discord.RichEmbed();
	embed.title = '__ようこそ！！ :tada: このサーバーの簡単な説明__';
	embed.setImage('https://i.imgur.com/56C1pjx.png');
	embed.addField('日本語で雑談', '#japanese_chat', true);
	embed.addField('英語で雑談', '#language_exchange', true);
	embed.addField('英語で言語交換', '#language_exchange', true);
	embed.addField('英語に関する質問', '#english_questions', true);
	embed.addField('その他ルールは #server_rules の下の方に日本語で説明があります', '', true);
	embed.color = 16711935;
	message.channel.send({embed});
}
