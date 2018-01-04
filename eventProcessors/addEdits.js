module.exports.name = 'addEditedMessages';
module.exports.events = ['EDIT'];

const SimpleMsg = require('../classes/SimpleMessage.js');
const Util = require('../classes/Util.js');

module.exports.isAllowed = (message, server) => {
  return server.watchedUsers.includes(message.author.id);
};


module.exports.process = async function(message) {
  let simple = new SimpleMsg({message : message, del: false});
  Util.postLogs(simple);
};