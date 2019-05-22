module.exports.name = 'unwatch';
module.exports.alias = [
  'unwatch'
];
module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Take someone off the watchlist.';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }
  let mentions = message.mentions.users;
  let userID = content.trim();
  if (mentions.size != 0) {
    userID = mentions.firstKey();
  }
  if (!/^\d+$/.test(userID)) {
    message.channel.send('Invalid user or user ID. ');
    return;
  }
  let index = server.watchedUsers.indexOf(userID);
  if (~index) {
    server.watchedUsers.splice(index, 1);
    message.channel.send(`<@${userID}> is now off the hook`);
  } else {
    message.channel.send(`<@${userID}> wasn't being watched tho :cirithink:`);
  }
};
