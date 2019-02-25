module.exports.name = 'readme';

module.exports.alias = [
  'readme'
];


module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = 'Readme message for new users in English. Use `,yonde` for Japanese.';

let lastCalled = 0;

const Discord = require('discord.js');


module.exports.command = (message) => {
  const now = new Date();
  if (now - lastCalled < 10000) {
    message.delete({timeout: 200});
    return;
  } // 10 sec cooldown
  lastCalled = now;
  let mentioned = message.mentions.members.first();
  let embed = new Discord.MessageEmbed();
  embed.title = `WELCOME${mentioned ? ' ' + mentioned.user.username: ''}!! 🎉 READ ME!`;
  embed.description = '__**[Japanese Starting Guide](https://github.com/ryry013/Awesome-Japanese/blob/master/readme.md)**__<:externallink:438354612379189268>';
  embed.setImage('https://i.imgur.com/7cjLRRM.png');
  embed.addField('**↓Rules↓ ↑Link to Resources↑**', '<#189585230972190720>', false);
  embed.color = 16711935;
  message.delete({timeout: 200});
  message.channel.send({embed});
};
