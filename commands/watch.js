module.exports.name = 'watch';
module.exports.alias = ['watch'];
module.exports.initialize = (json, server) => {
  server.watchedUsers = [];
  if (!json || !json['watchedUsers']) return;
  server.watchedUsers = json['watchedUsers']; // surveillance
};

module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help =
  'Watch a user for deleted messages `,watch <@mention or ID>`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }
  let mentions = message.mentions.users;
  let user;
  if (mentions.size != 0) {
    user = mentions.cache.first();
  } else {
    // TODO: users.fetch first to cache?
    let member;
    try {
      member = await server.guild.member(content);
    } catch (e) {
      console.log(`Content: ${content} | ` + e);
    }
    if (member == undefined) return;
    user = member.user;
  }

  if (server.watchedUsers.includes(user.id)) {
    message.channel.send(`${user}  is already being watched`);
  } else {
    server.watchedUsers.push(user.id);
    message.channel.send(`${user} is now being watched for deleted messages`);
  }
};
