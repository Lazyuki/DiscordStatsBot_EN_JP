module.exports.name = 'broBan';
module.exports.events = ['NEW'];

module.exports.isAllowed = (message, server) => {
  return true;
};

module.exports.process = (message) => {
  let content = message.content;
  if (content.includes('Blake Rodriquez')) {
    message.member.ban({ days: 1, reason: 'spam' });
  }
};