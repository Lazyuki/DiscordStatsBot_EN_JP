const Discord = require('discord.js');
var sleep = require('sleep');

module.exports.alias = [
  'whodel',
  'deletedmessages',
  'dm',
  'wd'
];

module.exports.command = async (message, content = 10, bot) => {
  if (message.author.id != bot.owner_ID) return;
  let num = parseInt(content);
  if (num == NaN || num > 30) return;

  for (var i in bot.deletedMessages) {
    if (i >= num) break;
    let embed = new Discord.RichEmbed();
    var msg = bot.deletedMessages[i];
    var date = new Date(msg.timestamp * 1000);
    embed.title = `<@${msg.author_id}>`;
    embed.description = `${msg.content} `;
    embed.timestamp = date;
    message.channel.send({embed});
    sleep.msleep(200);
  }
  message.channel.send("Done displaying deleted messages");
};
