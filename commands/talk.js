module.exports.name = 'talk';

module.exports.alias = ['talk', 'say', 's'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Talk through Ciri. `,s [#channel] [things to say]`';

let channel;
const channelIDRegex = /<#(\d{17,20})>/g;

module.exports.command = (message, content, bot, server) => {
  let match = channelIDRegex.exec(content);
  if (match) {
    channel = server.guild.channels.get(match[1]);
  }
  if (channel) {
    content = content.replace(channelIDRegex, '');
    if (content.replace(' ', '') == '') {
      message.channel.send(`Channel set to #${channel.name}`);
      return;
    }
    channel.send(content);
  } else {
    message.channel.send('Define channel');
  }
};
