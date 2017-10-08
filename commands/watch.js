module.exports.alias = [
	'watch'
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

	if (server.watchedUsers[user.id]) {
		message.channel.send(user.username + ' is already being watched');
	} else {
		server.watchedUsers[user.id] = [];
		message.channel.send(user.username + ' is now being watched for deleted messages');
	}
};
