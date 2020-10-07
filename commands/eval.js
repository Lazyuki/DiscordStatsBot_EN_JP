module.exports.name = 'eval';

module.exports.alias = ['eval'];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;
};

module.exports.help =
  '__Owner only__: Eval. Can access message, content, bot, server. Send to the channel with `send()`';

const Discord = require('discord.js');

module.exports.command = async (message, content, bot, server) => {
  try {
    let send = (str) => message.channel.send(str);
    let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    content = `try { ${content} } catch (e) { send(e.message) }`;
    let embed = new Discord.RichEmbed();
    let func = new AsyncFunction(
      'message',
      'content',
      'bot',
      'server',
      'send',
      'embed',
      content
    );
    func(message, content, bot, server, send, embed);
  } catch (e) {
    message.channel.send(e.message);
  }
};
