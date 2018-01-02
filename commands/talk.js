module.exports.name = 'talk';

module.exports.alias = [
  'talk',
  'say',
  's'
];


module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.ownerID;
};

module.exports.help = 'Talk through Ciri. `,s [#channel] [things to say]`';

let channel;
const Util = require('../classes/Util.js');

module.exports.command = (message, content) => {
  if (message.mentions.channels.size > 0) {
    channel = message.mentions.channels.first();
  }
  if (channel) {
    content = content.replace(Util.REGEX_CHAN, '');
    channel.send(content);
  }
};
