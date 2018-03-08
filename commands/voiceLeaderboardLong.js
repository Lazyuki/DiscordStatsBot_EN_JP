const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'voiceLeaderboardLong';

module.exports.alias = [
  'vclong'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;
};

module.exports.help = '`,v [username (default = invoker)]` Voice leaderboard for this server.';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let u = content == '' ? message.author : Util.searchUser(message, content, server, bot);
  if (!u) {
    message.react('❓');
    return;
  }
  let users = server.users;
  let result = new BST();
  for (let user in users) {
    let res = users[user].voiceTime();
    if (res != 0) {
      result.add(user, res);
    }
  }
  result = result.toMap();
  let li= '';

  for (let user in result) {
    let hours = Math.floor(result[user] / 60); 
    let vcTime = `${hours ? hours + 'hr '  : ''}${result[user] % 60}min`;
    li += (await bot.fetchUser(user)).username + ' : ' + vcTime + '\n';
    if (li.length > 2000) {
      break;
    }
  }
  channel.send(li.substr(0, 2000));
};
