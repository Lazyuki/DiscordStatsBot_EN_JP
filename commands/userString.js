const Discord = require('discord.js');

module.exports.alias = [
	'ustr'
];

module.exports.command = async (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
  var user = message.author; // default
  let mentions = message.mentions.members;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') { // search name
    content = content.toLowerCase();
    for (var id in server.users) {
      let u = server.guild.members.get(id);
      if (u == undefined) continue; // if banned or left
      if (u.user.username.toLowerCase().startsWith(content)
          || u.displayName.toLowerCase().startsWith(content)) {
        user = u.user;
        break;
      }
    }
    if (user.id == message.author.id) { // Search failed
			message.react('❓');
      return;
    }
  }

  var record = server.users[user.id];
	let member = await server.guild.fetchMember(user);

	// the user hasn't sent anything in the past 30 days
	if (record == undefined) {
		let embed = new Discord.RichEmbed();
		embed.title = `Stats for ${user.username}`;
		embed.description = 'Hasn\'t said anything in the past 30 days'
		embed.color = Number('0x3A8EDB');
		if (member) { // ban check
			embed.setFooter('Joined ');
			embed.timestamp = member.joinedAt;
		}
		message.channel.send({embed});
		return;
	}
	console.log(JSON.stringify(record));
  message.channel.send('done');
};
