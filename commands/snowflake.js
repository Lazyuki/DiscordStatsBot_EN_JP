const Discord = require('discord.js');
const dateFormat = require('dateformat');

module.exports.alias = [
	'snowflake',
  'sf',
  'id'
];

module.exports.command = (message, content, bot) => {
  let chan = message.channel;
	if (content.length > 23) return;
	//SF id with mentions?
  let date = Discord.SnowflakeUtil.deconstruct(content).date;
	let embed = new Discord.RichEmbed();
	let dateStr = dateFormat(date, "UTC:ddd mmm dS, yyyy 'at' h:MM TT");
	embed.title = `Creation time in UTC and your local time`;
	embed.description = 'Snowflake ID: ' + content;
	embed.setFooter(`UTC | ${dateStr } --- Local`);
	embed.color = Number('0x3A8EDB');
	embed.timestamp = date;
	chan.send({embed});
};
