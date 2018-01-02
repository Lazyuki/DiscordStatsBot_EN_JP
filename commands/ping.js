const Discord = require('discord.js');

module.exports.name = 'ping';

module.exports.alias = [
  'ping'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = 'Ping in milliseconds';

module.exports.command = (message) => {
  let now = new Date().getTime();
  let date = Discord.SnowflakeUtil.deconstruct(message.id).date;
  message.channel.send(`${now - date.getTime()} ms`);
};
