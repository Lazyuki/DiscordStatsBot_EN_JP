const Discord = require('discord.js');
const sleep = require('sleep');

module.exports.alias = [
  'deleted2',
  'del2'
];

// deprecated!
module.exports.command = async (message, content, bot, server) => {
  if (message.author.id != bot.owner_ID) return;
  //if (!message.member.hasPermission('ADMINISTRATOR')) return;

  var num = parseInt(content);
  if (!num) num = 5;
  var userID = null;
  if (num > 30) {
    userID = num;
    num = 30;
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

    let embed = new discord.RichEmbed();
    let date = new Date(msg.time);
    embed.setAuthor(`${msg.a + msg.atag} ID: ${msg.aid}` ,msg.apfp);
    if (msg.del) { // message was deleted
      embed.title = `Message Deleted after ${msg.dur} seconds`;
      embed.description = `${msg.con}`;
      embed.color = Number('0xDB3C3C');
    } else { // message was edited
      embed.title = `Message Edited after ${msg.dur} seconds`;
      embed.addField('Before:', `${msg.con}`, false);
      embed.addField('After:', `${msg.acon}`, false);
      embed.color = Number('0xff9933');
    }
    embed.setFooter(`#${msg.ch}`)
    embed.timestamp = date;
    if (msg.img) { // if != null
      embed.setImage(msg.img);
    }
    message.channel.send({embed});
    //sleep.msleep(400); // put await on the line above
  }
  message.channel.send("Done displaying deleted messages");
};
