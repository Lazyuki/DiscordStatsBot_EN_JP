module.exports.name = 'kawaii';

module.exports.alias = [
  'kawaii'
];


module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = 'Shows who is the kawaiiest.';

const Discord = require('discord.js');

module.exports.command = (message) => {
  let embed = new Discord.MessageEmbed();
  embed.setImage('https://i.imgur.com/hRBicd2.png');
  embed.color = 16753111;
  message.channel.send({embed});
};
