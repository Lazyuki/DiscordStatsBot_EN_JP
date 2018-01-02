module.exports.name = 'echo';

module.exports.alias = [
  'echo'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = '`,echo <things to say>` Repeat what you\'ve said, normally and inside a code block.';

module.exports.command = (message, content) => {
  message.channel.send(content);
  message.channel.send(`\`\`\`${content}\`\`\``);
};
