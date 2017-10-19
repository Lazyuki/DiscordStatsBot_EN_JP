const Discord = require('discord.js');
const sleep = require('sleep');

module.exports.alias = [
  'deleted',
  'del',
  'dm'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
  if (content == '') {
		message.channel.send('Please specify a user with an ID or mention them');
		return;
	}
	let mentions = message.mentions.members;
  let args = content.split(' ');
  var num = args[1];
  if (!(num > 0)) {
    num = 5;
  }
	var user;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') {
	  let member = await server.guild.fetchMember(args[0]);
		if (member == undefined) return;
		user = member.user;
	}
	let delMsgs = server.watchedUsers[user.id];
	if (delMsgs) {
		for (var i in delMsgs) {
      if (i >= num) break; // enough messages
	    let msg = delMsgs[delMsgs.length - 1 - i];
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
      embed.setFooter(`#${msg.ch}`)
      embed.timestamp = date;
      if (msg.img) { // if != null
        embed.setImage(msg.img);
      }
      message.channel.send({embed});
	  }
	  message.channel.send("Done displaying deleted messages");
	} else {
		message.channel.send(user.username + ' was not being watched');
	}
};
