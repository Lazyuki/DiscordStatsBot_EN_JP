module.exports.name = 'checkBeginnerJapanese';
module.exports.events = ['NEW'];

module.exports.initialize = (json, server) => {
  server.engUsed = {};
  if (!json || !json['engUsed']) return;
  server.engUsed = json['engUsed'];
};
module.exports.isAllowed = (message) => {
  return message.channel.id == '189629338142900224'; // #japanese-chat
};

const Util = require('../classes/Util.js');
const geralthinkbans = ['<:geralthink:395582438270566403>', '<:geralthinkban:443803648741605387>', '<:hypergeralthinkban:443803651325034507>', '<:hypergeralthinkbanreallyfast:443803653221122078>'];

module.exports.process = (message, server) => {
  let lang = Util.lang(message.content);
  if (lang & Util.LANG.ENG) {
    if (!server.engUsed[message.author.id]) server.engUsed[message.author.id] = 0;
    let engCount = server.engUsed[message.author.id]++;
    if (engCount >= 2) {
      if (engCount <= 5) {
        message.react(geralthinkbans[engCount - 2]); // allow 2 english
      }
      if (engCount >= 4) {
        message.channel.send(`${message.author.toString()} ここでは日本語を使用して下さい。Please **only** use Japanese here.`);
      } 
      if (engCount >= 6) {
        message.channel.overwritePermissions(message.author, {SEND_MESSAGES: false});
        message.channel.send(`日本語を使わなかったため${message.author.toString()}をミュートしました。管理者のみミュート解除できます。\nYou have been muted in here for not using Japanese. Contact a mod.`);
      }
    }
  } else if (lang & Util.LANG.JPN) {
    delete server.engUsed[message.author.id];
  }
};