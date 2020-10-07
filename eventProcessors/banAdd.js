module.exports.name = 'banADD';
module.exports.events = ['BAN_ADD'];

module.exports.isAllowed = () => {
  return true;
};

module.exports.process = async function (user, server) {
  // Clean up watchedUsers
  let index = server.watchedUsers.indexOf(user.id);
  if (index == -1) return;
  server.watchedUsers.splice(index, 1);
};
