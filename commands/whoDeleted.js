const Discord = require('discord.js');
const sleep = require('sleep');

module.exports.alias = [
  'deletedmessages',
  'dm',
  'deleted'
];

module.exports.command = async (message, content, bot, server) => {
  if (message.author.id != bot.owner_ID) return;
  //if (!message.member.hasPermission('ADMINISTRATOR') && message.author.id != bot.owner_ID) return;

  var num = parseInt(content);
  if (!num) num = 5;
  var userID = null;
  if (num > 50) {
    userID = num;
    num = 50;
  }
  let mentions = message.mentions;
  let chans = mentions.channels;
  //let users = mentions.users;

  let chanMention = chans.size > 0;
  //let userMention = users.size > 0;

  for (var i in server.deletedMessages) {
    if (i >= num) break;
    let msg = server.deletedMessages[server.deletedMessages.length - 1 - i];
    if (chanMention) {
      if (!chans.has(msg.chid)) continue;
    }
    if (userID) {
      if (userID != msg.aid) continue;
    }

    let embed = new Discord.RichEmbed();
    let date = new Date(msg.time);
    embed.title = `${msg.a} : <@${msg.aid}>`;
    embed.description = `${msg.con}`;
    embed.setFooter(`#${msg.ch}`)
    embed.timestamp = date;
    embed.color = Number('0xDB3C3C');
    message.channel.send({embed});
    sleep.msleep(1000); // 1 sec
  }
  message.channel.send("Done displaying deleted messages");
};
