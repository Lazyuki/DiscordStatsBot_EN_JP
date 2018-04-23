module.exports.name = 'unwatch';
module.exports.alias = [
  'unwatch'
];
module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id) && message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = 'Take someone off the watchlist.';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }
  let mentions = message.mentions.members;
  let userID = content;
  if (mentions.size != 0) {
    userID = mentions.firstKey();
  }
  let index = server.watchedUsers.indexOf(userID);
  if (~index) {
    server.watchedUsers.splice(index, 1);
    message.channel.send(`<@${userID}> is now off the hook`);
  } else {
    message.channel.send(`<@${userID}> wasn't being watched tho :cirithink:`);
  }
};
