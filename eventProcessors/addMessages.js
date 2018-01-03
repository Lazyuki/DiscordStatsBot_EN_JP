module.exports.name = 'addMessages';
module.exports.actions = ['NEW'];

const UserRecord = require('../classes/UserRecord.js');

module.exports.initialize = (json, server) => {
  server.today = 0;
  server.users = {};
  if (!json || !json['users']) return;
  server.today = json['today'];  
  for (let user in json['users']) {
    let uRec = json['users'][user];
    server.users[user] = new UserRecord(uRec);
  }
};
module.exports.isAllowed = () => {
  return true;
};

module.exports.process = async function(message, server, bot, language) {
  let author = message.author.id;
  let channel = message.channel.id;
  if (!server.users[author]) {
    server.users[author] = new UserRecord();
  }
  let userRec = server.users[author];
  userRec.add(message.content, channel, server.today, language);
};