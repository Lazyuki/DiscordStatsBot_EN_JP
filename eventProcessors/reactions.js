
module.exports.name = 'reactions';
module.exports.events = ['REACT'];

module.exports.isAllowed = () => {
  return true; // Myself
};

//let rateLimit = new Array(3);
module.exports.process = async (reaction, user, added, server) => {
  let record = server.users[user.id];
  if (!record) return; // the user has no record
  console.log(`name: ${reaction.emoji.name} id: ${reaction.emoji.id} ident: ${reaction.emoji.identifier} str: ${reaction.emoji}`);
  reaction.message.channel.send(`${reaction.emoji.name} ${reaction.emoji.id} ${reaction.emoji.identifier} ${reaction.emoji}`);
  return;
  if (added) {
    record.addReacts(reaction.toString(), server.today);
  } else {
    record.removeReacts(reaction.toString(), server.today);
  }
};