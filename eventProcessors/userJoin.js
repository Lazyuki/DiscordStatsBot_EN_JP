module.exports.name = 'userJoin';
module.exports.actions = ['JOIN'];

module.exports.initialize = (json, server) => {
  server.newUsers = [];
  if (!json || !json['newUsers']) return;
  server.newUsers = json['newUsers'];
};
module.exports.isAllowed = () => {
  return true;
};

module.exports.process = async (memberID, server) => {
  if (server.newUsers.unshift(memberID) > 3) server.newUsers.pop();
};
