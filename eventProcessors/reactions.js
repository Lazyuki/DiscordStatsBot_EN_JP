
module.exports.name = 'reactions';
module.exports.events = ['REACT'];

module.exports.isAllowed = () => {
  return true; // Myself
};

module.exports.process = async (reaction, user, added, server) => {
  let record = server.users[user.id];
  if (!record) return; // the user has no record
  if (added) {
    record.addReacts(reaction.emoji.name, server.today);
  } else {
    record.removeReacts(reaction.emoji.name, server.today);
  }
};