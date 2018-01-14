module.exports.name = 'ignored';

module.exports.alias = [
  'ignored'
];

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = 'Shows a list of ignored channels.';

module.exports.command = (message, content, bot, server) => {
  let arr = server.ignoredChannels;
  let s = '';
  for (let index in arr) {
    if (!arr[index]) continue; // undefined
    s += `<#${arr[index]}>\n`;
  }
  message.channel.send(s);
};
