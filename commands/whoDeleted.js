const Discord = require('discord.js');
var sleep = require('sleep');

module.exports.alias = [
  'whodel',
  'deletedmessages',
  'dm',
  'wd'
];

module.exports.command = async (message, content, bot) => {
  if (message.author.id != bot.owner_ID) return;
  var num = parseInt(content);
  if (num == NaN) num = 10;
  let mentions = message.mentions;
  let chans = mentions.channels;
  let users = mentions.users;

  let chanMention = chans.size > 0;
  let userMention = users.size > 0;
// by name
  for (var i in bot.deletedMessages) {
    if (i >= num) break;
    let msg = bot.deletedMessages[bot.deletedMessages.length - 1 - i];
    if (chanMention) {
      if (!chans.has(msg.channel_id)) continue;
    }
    if (userMention) {
      if (!users.has(msg.author_id)) continue;
    }
    let embed = new Discord.RichEmbed();
    let date = new Date(msg.timestamp);
    embed.title = `${msg.author} : <@${msg.author_id}>`;
    embed.description = `${msg.content}`;
    embed.setFooter(`#${msg.channel}`)
    embed.timestamp = date;
    embed.color = Number('0xDB3C3C');
    message.channel.send({embed});
    sleep.msleep(200);
  }
  message.channel.send("Done displaying deleted messages");
};
