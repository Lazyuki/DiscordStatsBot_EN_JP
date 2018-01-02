module.exports.name = 'deleted';
module.exports.alias = [
  'del'
];

const Discord = require('discord.js');
const SimpleMsg = require('../classes/SimpleMessage');

module.exports.iniaialize = (json, server) => {
  if (!json['deletedMessages']) {
    server.deletedMessages = [];
    return;
  }
  for (let msg in json['deletedMessages']) {
    let dm = json['deletedMessages'][msg];
    server.deletedMessages.push(new SimpleMsg({simple:dm}));
  }
};

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help = '`,del` Shows deleted messages by users.';

module.exports.command = async (message, content, bot, server) => {
  let num = parseInt(content);
  if (!num) num = 5;
  let userID = null;
  if (num > 30) {
    userID = num;
    num = 30;
  }
  let mentions = message.mentions;
  let chans = mentions.channels;
  //let users = mentions.users;

  let chanMention = chans.size > 0;
  //let userMention = users.size > 0;

  for (let i in server.deletedMessages) {
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
    embed.setAuthor(`${msg.atag} ID: ${msg.aid}` ,msg.apfp);
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
    embed.setFooter(`#${msg.ch}`);
    embed.timestamp = date;
    if (msg.img) { // if != null
      embed.setImage(msg.img);
    }
    message.channel.send({embed});
    //sleep.msleep(400); // put await on the line above
  }
  message.channel.send('Done displaying deleted messages');
};
