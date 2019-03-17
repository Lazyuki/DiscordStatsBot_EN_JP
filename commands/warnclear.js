const Util = require('../classes/Util.js');

module.exports.name = 'warnclear';
module.exports.alias = [
  'warnclear',
];

module.exports.isAllowed = async (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Clear warnings on a user `,warnclear <User>`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }

  let userID;
  let mentions = message.mentions.users;
  if (mentions.size != 0) {
    userID = mentions.first().id;
  } else {
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (idMatch) {
      userID = idMatch[0];
    }
  }
  if (!userID) {
    message.channel.send('Failed to get a user');
    return;
  };

  if (server.warnlist[userID]) {
    delete server.warnlist[userID];
    message.channel.send(`Warnings cleared for <@${userID}>`);
  } else {
    message.channel.send(`<@${userID}> has no warnings.`);
  }
};
