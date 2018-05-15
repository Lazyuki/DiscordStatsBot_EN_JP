const Discord = require('discord.js');
module.exports.name = 'yonde';
module.exports.alias = [
  'yonde'
];
module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161';
};

module.exports.help = 'Readme message for new users in Japanese. Use `,readme` for English.';

module.exports.command = (message) => {
  let mentioned = message.mentions.members.first();
  let embed = new Discord.RichEmbed();
  embed.title = `${mentioned ? mentioned.user.username + 'さん': ''}ようこそ！！ 🎉 このサーバーの簡単な説明です`;
  embed.setImage('https://i.imgur.com/rXLn5Ay.png');
  //embed.addField('日本語で雑談', '<#189629338142900224>', true);
  //embed.addField('英語に関する質問', '<#193959229030268938>', true);
  embed.addField('注意事項（必読）', '<#189585230972190720> で上にスクロールすると説明があります！', true);
  embed.color = 16711935;
  message.channel.send({embed});
};
