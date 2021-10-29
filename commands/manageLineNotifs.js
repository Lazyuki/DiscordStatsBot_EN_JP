const config = require('../config.json');

module.exports.name = 'manageline';
module.exports.alias = ['line'];
module.exports.initialize = (json, server) => {
  server.hiddenChannels = [];
  if (!json || !json['hiddenChannels']) return;
  server.hiddenChannels = json['hiddenChannels'];
};

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id === bot.owner_ID;
};

module.exports.help =
  '`,line <add|del> <id> <active staff ping? (no | always | offline)> <personal ping? (no | always | offline)>\ne.g. `,line add 284840842026549259 offline offline`';

module.exports.command = (message, content, bot, server) => {
  let chan = server.guild.channels.cache.get(content);
  if (chan) {
    if (server.hiddenChannels.includes(content)) return;
    server.hiddenChannels.push(chan);
    message.channel.send(`#${chan.name} is hidden now.`);
  } else if (message.mentions.channels.size != 0) {
    for (let [id, ch] of message.mentions.channels) {
      if (server.hiddenChannels.includes(id)) return;
      server.hiddenChannels.push(id);
      message.channel.send(`#${ch.name} is hidden now.`);
    }
  }
};
