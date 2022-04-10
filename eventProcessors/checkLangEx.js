module.exports.name = 'checkLanguageExchange';
module.exports.events = ['NEW', 'EDIT'];

module.exports.isAllowed = (message) => {
  return message.channel.id == '376574779316109313'; // #language_exchange
};

const Util = require('../classes/Util.js');

module.exports.process = (message, server, bot, language) => {
  return;
  let isJapanese =
    message.member.roles.cache.has('196765998706196480') && // no dual natives
    !message.member.roles.cache.has('197100137665921024'); // has native japanese
  if (
    (language & Util.LANG.JPN && isJapanese) ||
    (language & Util.LANG.ENG && !isJapanese)
  ) {
    if (!(language & Util.LANG.ESC) && !(language & Util.LANG.OTH)) {
      message.react('🚫');
      return;
    }
  }
  for (let r of message.reactions.cache.values()) {
    if (r.me) r.remove();
  }
};
