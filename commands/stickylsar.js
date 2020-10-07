module.exports.name = 'stickyListSelfAssignableRoles';

module.exports.alias = ['setlsar', 'stickylsar', 'sticky'];
module.exports.initialize = (json, server) => {
  server.sticky = '';
  if (!json || !json['sticky']) return;
  server.sticky = json['sticky'];
};

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help =
  ' Set the sticky list-self-assingable-roles channel.\n `,sticky <#channel>`';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.mentions.channels.first();
  if (channel) {
    server.sticky = channel.id;
    channel.messages.fetch();
    message.channel.send(`LSAR sticky channel set to <#${channel.id}>`);
  } else {
    message.channel.send('Please provide a valid channel');
  }
};
