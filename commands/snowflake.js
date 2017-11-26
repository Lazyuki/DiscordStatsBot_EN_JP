const Discord = require('discord.js');
const dateFormat = require('dateformat');
const sleep = require('sleep');
const Util = require('../classes/Util.js');

module.exports.alias = [
	'snowflake',
  'sf',
  'id'
];

module.exports.command = (message, content, bot, server) => {
	if (content == '') {
		message.channel.send('Give me either \`@mention\`, \`#channel\`, \`valid snowflake ID\`, or the user\'s name');
		return
	}
  let chan = message.channel;
	let mentions = message.mentions;
  let chans = mentions.channels;
  let users = mentions.users;
  let chanMention = chans.size > 0;
  let userMention = users.size > 0;

	if (chanMention) {
		for (var c of chans.keys()) {
			let date = Discord.SnowflakeUtil.deconstruct(c).date;
			let embed = new Discord.RichEmbed();
			let dateStr = dateFormat(date, "UTC:ddd mmm dS, yyyy 'at' h:MM TT");
			embed.title = `Creation time in UTC and your local time`;
			embed.description = 'Snowflake ID: ' + c + ` (<#${c}>)`;
			embed.setFooter(`UTC | ${dateStr } --- Local`);
			embed.color = Number('0x3A8EDB');
			embed.timestamp = date;
			chan.send(c, {embed});
		}
	}
	if (userMention) {
		for (var u of users.keys()) {
			let date = Discord.SnowflakeUtil.deconstruct(u).date;
			let embed = new Discord.RichEmbed();
			let dateStr = dateFormat(date, "UTC:ddd mmm dS, yyyy 'at' h:MM TT");
			embed.title = `Creation time in UTC and your local time`;
			embed.description = 'Snowflake ID: ' + u + ` (<@${u}>)`;
			embed.setFooter(`UTC | ${dateStr } --- Local`);
			embed.color = Number('0x3A8EDB');
			embed.timestamp = date;
			chan.send(u, {embed});
		}
	}
	if (!chanMention && !userMention) {
		let def = '1420070400000' 
    let id = content;
		let date = Discord.SnowflakeUtil.deconstruct(content).date;
		let u = Util.searchUser(message, content, server);
		if (u) {
			date = Discord.SnowflakeUtil.deconstruct(u.id).date;
      id = u.id;
		} else {
			if (def == date.getTime()) {
				message.channel.send('Invalid snowflake ID');
				return;
			}
		}
		let embed = new Discord.RichEmbed();
		let dateStr = dateFormat(date, "UTC:ddd mmm dS, yyyy 'at' h:MM TT");
		embed.title = `Creation time in UTC and your local time`;
		embed.description = 'Snowflake ID: ' + id;
		embed.setFooter(`UTC | ${dateStr } --- Local`);
		embed.color = Number('0x3A8EDB');
		embed.timestamp = date;
		chan.send(id, {embed});
	}
};
