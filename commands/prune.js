module.exports.alias = [
	'prune'
];

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	var ids = content.split(' ');
	var lastMessageID = message.id;
	var done = false;
	var now = (new Date()).getTime();
	var day = 24 * 60 * 60 * 1000;
  var count = 0;
	while (!done) {
		let messages = await message.channel.fetchMessages({limit:100,before:lastMessageID});
    let delMsgs = [];
    let num = 0;
    for (var m of messages.values()) {
      count++;
      if (++num == 100) {
        if (now - m.createdAt.getTime() > day) {
          done = true;
          break;
        } else {
          lastMessageID = m.id;
        }
			};
			if (ids.indexOf(m.author.id) != -1) {
				delMsgs.push(m);
			}
		}
    if (delMsgs.length > 1) {
		  message.channel.bulkDelete(delMsgs);
    }
	}
	message.channel.send(`Checked ${count} messages and it's all clear!`);
};
