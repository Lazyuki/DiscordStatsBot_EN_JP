module.exports.name = 'ignoreChannel';
module.exports.alias = ['ignore'];
module.exports.initialize = (json, server) => {
  server.ignoredChannels = [];
  if (!json || !json['ignoredChannels']) return;
  server.ignoredChannels = json['ignoredChannels'];
};

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help =
  '`,ignore <#channel>` ignores a channel from leaderboards. Normal commands still work there.';

module.exports.command = (message, content, bot, server) => {
  let chan = server.guild.channels.cache.get(content);
  if (chan) {
    if (server.ignoredChannels.includes(content)) return;
    server.ignoredChannels.push(chan);
    message.channel.send(`#${chan.name} is ignored now.`);
  } else if (message.mentions.channels.size != 0) {
    for (let [id, ch] of message.mentions.channels) {
      if (server.ignoredChannels.includes(id)) return;
      server.ignoredChannels.push(id);
      message.channel.send(`#${ch.name} is ignored now.`);
    }
  }
};
