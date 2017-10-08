const Discord = require('discord.js');

module.exports.alias = [
	'show',
	'wdm'

];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	let mentions = message.mentions.members;
	var user;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') {
	  let member = await server.guild.fetchMember(content);
		if (member == undefined) return;
		user = member.user;
	}

	let delMsgs = server.watchedUsers[user.id];
	if (delMsgs) {
		for (var i in delMsgs) {
	    let msg = delMsgs[delMsgs.length - 1 - i];
			let embed = new Discord.RichEmbed();
	    let date = new Date(msg.time);
	    embed.title = `${msg.a} : <@${msg.aid}>`;
	    embed.description = `${msg.con}`;
	    embed.setFooter(`#${msg.ch}`)
	    embed.timestamp = date;
	    embed.color = Number('0xDB3C3C');
	    message.channel.send({embed});
	  }
	  message.channel.send("Done displaying deleted messages");
	} else {
		message.channel.send(user.username + ' was not being watched');
	}
};
