module.exports.name = 'notifyLINE';
module.exports.events = ['NEW'];
const ryryID = '202995638860906496';
const ririID = '282243864771821568';
const zappiID = '652705051684503557';
const skyzID = '107202830846148608';
const IDs = [ryryID, ririID, zappiID, skyzID];

const activeStaff = '240647591770062848';
const config = require('../config.json');
const request = require('request');

module.exports.isAllowed = (message, server, bot) => {
  const mentions = message.mentions.users;
  return (
    mentions.has(bot.owner_ID) ||
    message.mentions.roles.has(activeStaff) || // active staff
    IDs.some((id) => mentions.has(id))
  );
};

function notify(message, token) {
  const options = {
    method: 'POST',
    url: 'https://notify-api.line.me/api/notify',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    formData: {
      message: `#${message.channel.name}\n${message.author.username}:\n${message.cleanContent}`,
    },
  };
  request(options, function (error) {
    if (error) console.log(error);
  });
}

module.exports.process = async (message, server, bot) => {
  const hasActiveStaff = message.mentions.roles.has(activeStaff);
  if (message.content.startsWith('t!') || message.content.startsWith('.'))
    return; // ignore bot commands
  const me = await server.guild.member(bot.owner_ID);
  const ry = await server.guild.member(ryryID);
  const riri = await server.guild.member(ririID);
  const skyz = await server.guild.member(skyzID);

  if (
    (me.presence.status == 'offline' &&
      (message.mentions.users.has(bot.owner_ID) || hasActiveStaff)) ||
    (!me.roles.cache.has(activeStaff) && hasActiveStaff)
  ) {
    // If I'm offline
    notify(message, config.LINEnotifyToken);
  }
  if (
    (ry.presence.status == 'offline' && message.mentions.users.has(ryryID)) ||
    hasActiveStaff
  ) {
    notify(message, config.ryryLINEnotifyToken);
  }

  if (
    riri.presence.status == 'offline' &&
    (message.mentions.users.has(ririID) || hasActiveStaff)
  ) {
    notify(message, config.ririLINEnotifyToken);
  }

  if (hasActiveStaff) {
    notify(message, config.zappiLINEnotifyToken);
  }

  if (skyz.presence.status === 'offline' && hasActiveStaff) {
    notify(message, config.skyzLINEnotifyToken);
  }
};
