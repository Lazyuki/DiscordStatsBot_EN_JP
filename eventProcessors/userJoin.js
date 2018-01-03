module.exports.name = 'userJoin';
module.exports.actions = ['JOIN'];

module.exports.initialize = (json, server) => {
  server.newUsers = [];
  if (!json || !json['newUsers']) return;
  console.log(json['newUsers']);
  server.newUsers = json['newUsers'];
};
module.exports.isAllowed = () => {
  return true;
};

module.exports.process = async (memberID, server) => {
  console.log(server.newUsers);
  if (server.newUsers.push(memberID) > 3) server.newUsers.shift();
};