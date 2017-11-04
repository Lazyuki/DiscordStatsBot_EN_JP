module.exports.alias = [
	'watch'
];

module.exports.command = async (message, content, bot, server) => {
	if (server.guild.id != '189571157446492161') return; // Only for EJLX server
	if (!message.member.hasPermission('ADMINISTRATOR')) {
		if (!server.hiddenChannels.includes(message.channel.id)) return;
	};

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

	if (user.id in server.watchedUsers) {
		message.channel.send(user.username + ' is already being watched');
	} else {
		server.watchedUsers.push(user.id);
		message.channel.send(user.username + ' is now being watched for deleted messages');
	}
};
