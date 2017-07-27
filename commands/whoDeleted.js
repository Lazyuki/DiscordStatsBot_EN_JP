module.exports.alias = [
  'whodel',
  'deletedmessages',
  'dm',
  'wd'
];

module.exports.command = async (message, cont, bot) => {
  if (message.author.id != bot.owner_ID) return;
  var s = 'deleted messages: \n';
  for (var i in bot.deletedMessages) {
    var msg = bot.deletedMessages[i];
    s += (await bot.fetchUser(msg.author)).username + ' said: \`\`\`' + msg.content +
    '\`\`\` at: ' + msg.createdAt.toLocaleString() + '\n';
  }
  message.channel.send(s, split=true);
};
