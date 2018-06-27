module.exports.name = 'checkLanguageExchange';
module.exports.events = ['NEW', 'EDIT'];


module.exports.isAllowed = (message) => {
  return message.channel.id == '376574779316109313'; // #language_exchange
};

const Util = require('../classes/Util.js');

module.exports.process = (message, server, bot, language) => {
  let isJapanese = message.member.roles.has('196765998706196480'); // has native japanese
  if (((language & Util.LANG.JPN) && isJapanese) || ((language & Util.LANG.ENG) && !isJapanese)) {
    if (!(language & Util.LANG.ESC) && !(language & Util.LANG.OTH)) {
      message.react('🚫');
      return;      
    }
  }
  for (let r of message.reactions.values()) {
    if (r.me) r.users.remove();
  }
};