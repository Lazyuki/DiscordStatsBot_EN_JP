module.exports.alias = [
	'unwatch'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	if (content == '') {
		message.channel.send('Please specify a user with an ID or mention them');
		return;
	}
	let mentions = message.mentions.members;
	var user;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') {
	  let member = await server.guild.fetchMember(content);
		if (member == undefined) return;
		user = member.user;
	}

	if (server.watchedUsers.includes(user.id)) {
		var index = server.watchedUsers.indexOf(user.id);
	  if (index == -1) return; // sanity check
		server.watchedUsers.splice(index, 1);
		message.channel.send(user.username + ' is now off the hook');
	} else {
		message.channel.send(user.username + ' isn\'t being watched');
	}
};
