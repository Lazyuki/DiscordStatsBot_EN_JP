
module.exports.name = 'reactionEval';
module.exports.events = ['REACT'];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID; // Myself
};

module.exports.process = async (reaction, user, added, server, bot) => {
  if (reaction.emoji.toString() != '▶️') return;
  let message = reaction.message;
  message.react(reaction.emoji);
  let codeBlockRegex = /```\S*\n([\s\S]*?)```/g;
  let content = message.content;
  let match = codeBlockRegex.exec(content);
  if (match) {
    let code = match[1];
    let send = message.channel.send;
    try {
      eval(code);
    } catch (e) {
      send(e.message);
    }
  }
};