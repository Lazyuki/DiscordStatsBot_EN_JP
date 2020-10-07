module.exports.name = 'hidden';

module.exports.alias = ['hidden'];

module.exports.isAllowed = (message, server) => {
  return (
    message.member.hasPermission('ADMINISTRATOR') &&
    server.hiddenChannels.includes(message.channel.id)
  );
};

module.exports.help = 'Shows a list of hidden channels.';

module.exports.command = (message, content, bot, server) => {
  let arr = server.hiddenChannels;
  let s = '';
  for (let index in arr) {
    if (!arr[index]) continue; // undefined
    s += `<#${arr[index]}>\n`;
  }
  message.channel.send(s);
};
