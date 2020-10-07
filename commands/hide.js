module.exports.name = 'hide';
module.exports.alias = ['hide'];
module.exports.initialize = (json, server) => {
  server.hiddenChannels = [];
  if (!json || !json['hiddenChannels']) return;
  server.hiddenChannels = json['hiddenChannels'];
};

module.exports.isAllowed = (message, server) => {
  return (
    message.member.hasPermission('ADMINISTRATOR') &&
    server.hiddenChannels.includes(message.channel.id)
  ); // Remove hiddenChannels check from the production
};

module.exports.help =
  '`,hide <#channel>` hides a channel from general commands, unless it was invoked in one of the hidden channels.';

module.exports.command = (message, content, bot, server) => {
  let chan = server.guild.channels.get(content);
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
