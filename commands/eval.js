module.exports.name = 'eval';

module.exports.alias = [
  'eval'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Eval. Can access (message, content, bot, server)';

module.exports.command = async (message, content, bot, server) => {
  let send = (str) => message.channel.send(str);
  try {
    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    content = `try { ${content} } catch (e) { send(e.message) }`;
    let func = new AsyncFunction('message', 'content', 'bot', 'server', 'send', content);
    func(message, content, bot, server, send);
  } catch (e) {
    send(e.message);
  }
};
