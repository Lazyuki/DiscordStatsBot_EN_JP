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
	var userID = content;
  if (mentions.size != 0) {
    userID = mentions.firstKey();
  }
	let index = server.watchedUsers.indexOf(userID);
	if (~index) {
    server.watchedUsers.splice(index, 1);
		message.channel.send(`<@${userID}> is now off the hook`);
	} else {
		message.channel.send(`<@${userID}> wasn\'t being watched tho :cirithink:`);
	}
};
