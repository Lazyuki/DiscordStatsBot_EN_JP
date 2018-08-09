module.exports.name = 'broBan';
module.exports.events = ['NEW'];

module.exports.isAllowed = (message, server) => {
  return true;
};

module.exports.process = (message) => {
  if (/(blake rodriquez)|(blake rodriguez)|(clear springs)|(cshs)/i.test(message.content)) {
    message.member.ban({ days: 1, reason: 'spam' });
  }
};