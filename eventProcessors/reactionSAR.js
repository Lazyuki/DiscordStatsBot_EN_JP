const LANG_ROLES = require('../commands/languages').LANG_ROLES;

module.exports.name = 'reactionSelfAssignableRoles';
module.exports.events = ['REACT'];

module.exports.initialize = (json, server) => {
  server.sars = {};
  if (server.sticky) {
    let stickied = server.guild.channels.cache.get(server.sticky);
    if (stickied) stickied.messages.fetch(); // #server_rules
  }
  if (!json || !json['sars']) return;
  server.sars = json['sars'];
};
module.exports.isAllowed = (message) => {
  return (
    message.author.id === '299335689558949888' &&
    message.content.startsWith('React with')
  ); // Myself
};

//let rateLimit = new Array(3);
module.exports.process = async (reaction, user, added, server) => {
  if (server.sars[reaction.emoji.toString()]) {
    let roleID = server.sars[reaction.emoji.toString()];
    let member = await server.guild.member(user);
    if (!member) {
      console.log('SAR failed: ' + user.id);
      return;
    }
    if (added) {
      if (
        roleID === '384286851260743680' &&
        !LANG_ROLES.some((r) => member.roles.cache.has(r))
      ) {
        reaction.users.remove(user.id);
      } else {
        member.roles.add(roleID, 'self assigned');
      }
    } else {
      member.roles.remove(roleID, 'self assigned');
    }
  }
};
