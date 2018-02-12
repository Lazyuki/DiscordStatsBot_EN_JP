module.exports.name = 'reactionSelfAssignableRoles';
module.exports.events = ['REACT'];

module.exports.initialize = (json, server) => {
  server.sars = {};
  if (server.guild.id == '189571157446492161') { // IF EJLX, fetch the self assignable role message in 
    let server_rules = server.guild.channels.get('189585230972190720');
    server_rules.fetchMessages(); // #server_rules
  }
  if (!json || !json['sars']) return;
  server.sars = json['sars'];
};
module.exports.isAllowed = (message) => {
  return message.author.id == '299335689558949888' && message.content.startsWith('React with'); // Myself
};

//let rateLimit = new Array(3);
module.exports.process = async (reaction, user, added, server) => {
  if (server.sars[reaction.emoji.toString()]) {
    let roleID = server.sars[reaction.emoji.toString()];
    let member = await server.guild.fetchMember(user);
    if (!member) return;
    if (added) {
      member.addRole(roleID, 'self assigned');
    } else {
      member.removeRole(roleID, 'self assigned');
    }
    /*
    if (member.roles.has(roleID)) {
      member.removeRole(roleID, 'self assigned');
    } else {
      member.addRole(roleID, 'self assigned');
    }
    */
  }
};