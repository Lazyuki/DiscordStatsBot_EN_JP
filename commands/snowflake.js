const Discord = require('discord.js');

module.exports.alias = [
	'snowflake',
  'sf',
  'id'
];

module.exports.command = (message, content, bot) => {
  let chan = message.channel;
  let decon = Discord.SnowflakeUtil.deconstruct(content);
	chan.send(`Creation time: ${decon.date.toUTCString()}`);
};
