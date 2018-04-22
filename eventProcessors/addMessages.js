module.exports.name = 'addMessages';
module.exports.events = ['NEW'];

const UserRecord = require('../classes/UserRecord.js');
const Utils = require('../classes/Util.js');

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
module.exports.isAllowed = (message, server) => {
  return !server.ignoredChannels.includes(message.channel.id);
};

module.exports.process = async function(message, server, bot, language) {
  let author = message.author.id;
  let channel = message.channel.id;
  if (!server.users[author]) {
    server.users[author] = new UserRecord();
  }
  let userRec = server.users[author];
  userRec.add(message.content, channel, server.today, language);
  let emotes = message.content.match(Utils.REGEX_CUSTOM_EMOTES);
  if (emotes) {
    for (let emote of emotes) {
      userRec.addReacts(emote, server.today);
    }
  }
  let emojis = message.content.match(Utils.REGEX_EMOJIS);
  for (let c of emojis) {
    console.log(c);
    userRec.addReacts(c, server.today);
  }
};