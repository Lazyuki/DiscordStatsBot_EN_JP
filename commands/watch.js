module.exports.name = 'watch';
module.exports.alias = [
  'watch'
];
module.exports.initialize = (json, server) => {
  server.watchedUsers = [];
  if (!json || !json['watchedUsers']) return;
  server.watchedUsers = json['watchedUsers']; // surveillance
};

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return server.hiddenChannels.includes(message.channel.id) && message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = 'Watch a user for deleted messages `,watch <@mention or ID>`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }
  let mentions = message.mentions.members;
  var user;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') {
    // TODO: fetchUser first to cache?
    let member = await server.guild.fetchMember(content);
    if (member == undefined) return;
    user = member.user;
  }

  if (server.watchedUsers.includes(user.id)) {
    message.channel.send(user.username + ' is already being watched');
  } else {
    server.watchedUsers.push(user.id);
    message.channel.send(user.username + ' is now being watched for deleted messages');
  }
};
