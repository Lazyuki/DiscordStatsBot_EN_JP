module.exports.name = 'memory';
module.exports.alias = [
  'memory',
  'mem'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = '`,mem` Shows Ciri\'s memory usage.';

module.exports.command = (message) => {
  let used = process.memoryUsage();
  let str = '';
  for (let key in used) {
    str += `${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB\n`;
  }
  message.channel.send(str);
};
