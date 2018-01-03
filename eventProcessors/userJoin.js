module.exports.name = 'userJoin';
module.exports.actions = ['JOIN'];

module.exports.initialize = (json, server) => {
  server.newUsers = [];
  if (!json || !json['newUsers']) return;
  server.newUsers = Array.prototype.slice.call(json['newUsers']); // Why is it an object???
};
module.exports.isAllowed = () => {
  return true;
};

module.exports.process = async (memberID, server) => {
  console.log(typeof(server.newUsers));
  if (server.newUsers.push(memberID) > 3) server.newUsers.shift();
};