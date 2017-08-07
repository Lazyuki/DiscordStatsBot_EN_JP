const BST = require('../classes/BST.js');

module.exports.alias = [
  'oldies'
];

module.exports.command = (message, content, bot, server) => {
  if (message.author.id != bot.owner_ID) return;
  if (content == 'mainichi') {
    server = bot.servers['292389599982911488'];
  }
  let members = server.guild.members;
  let bst = new BST();
  for (var mem of members.values()) {
    bst.add(mem.user.tag, mem.joinedTimestamp);
  }
  let res = bst.toMapReverse();
  var count = 0;
  let s = '';
  for (var [key, value] of res) {
    if (count++ > 20) break;
    s += '**' + key.substring(0, key.length - 5) + '**' + key.substr(-5) + '\n';
  }

  message.channel.send(s);
};
