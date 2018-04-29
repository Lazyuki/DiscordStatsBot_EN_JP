module.exports.name = 'readme';

module.exports.alias = [
  'readme'
];


module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = 'Readme message for new users in English. Use `,yonde` for Japanese.';

const Discord = require('discord.js');

module.exports.command = (message) => {
  let mentioned = message.mentions.members.first();
  let embed = new Discord.RichEmbed();
  embed.title = `**WELCOME ${mentioned ? mentioned.user.username: ''}!! 🎉 READ ME!**`;
  embed.description = '__**[Japanese Starting Guide<:externallink:438354612379189268>](https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md)**__';
  embed.setImage('https://i.imgur.com/Wzy5eQD.png');
  //embed.addField('Ask Japanese Questions', '<#189601264424714241>', true);
  //embed.addField('Beginner Japanese Chat', '<#208118574974238721>', true);
  //embed.addField('Answer English Questions', '<#193959229030268938>', true);
  //embed.addField('Language Exchange', '<#376574779316109313>', true);
  embed.addField('**↓Rules↓ ↑Link to Resources↑**', '<#189585230972190720>', false);
  embed.color = 16711935;
  message.channel.send({embed});
};
