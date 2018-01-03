module.exports.name = 'usernameChange';
module.exports.actions = ['USER_UPDATE'];

module.exports.initialize = (json, server) => {
  server.watchedUsersNotes = {};
  if (!json || !json['watchedUsersNotes']) return;
  server.watchedUsersNotes = json['watchedUsersNotes'];
};
module.exports.isAllowed = (memberID, server) => {
  return server.watchedUsers.includes(memberID);
};

module.exports.process = async (newUser, server) => {
  if (server.watchedUsersNotes[newUser.id]) {
    server.watchedUsersNotes[newUser.id].push(newUser.username);    
  } else {
    server.watchedUsersNotes[newUser.id] = [newUser.username];    
  }
};