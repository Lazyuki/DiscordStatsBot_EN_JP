module.exports.alias = [
	'fix'
];

module.exports.command = (message, content, bot, server) => {
	if (message.author.id != bot.owner_ID) return;
	var user;
  if (content != '') { // search name
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
	record.jp = record.jp  - (record.jp / 10);
	message.channel.send('done');
};
