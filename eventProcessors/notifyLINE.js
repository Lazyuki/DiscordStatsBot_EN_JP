module.exports.name = 'notifyLINE';
module.exports.events = ['NEW'];
const ryryID = '202995638860906496';
const ririID = '282243864771821568';
const activeStaff = '240647591770062848';
const config = require('../config.json');
const request = require('request');

module.exports.isAllowed = (message, server, bot) => {
  return message.mentions.users.has(bot.owner_ID) || message.mentions.roles.has(activeStaff) // active staff
   || message.mentions.users.has(ryryID)|| message.mentions.users.has(ririID);
};


function notify(message, token) {
  let options = { method: 'POST',
    url: 'https://notify-api.line.me/api/notify',
    headers:
        {
          'authorization': `Bearer ${token}`,
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
        },
    formData: {message: `#${message.channel.name}\n@${message.author.username}:\n${message.cleanContent}`}
  };
  request(options, function (error) {
    if (error) console.log(error);
  });
}

module.exports.process = async (message, server, bot) => {
  if (message.content.startsWith('t!') || message.content.startsWith('.')) return; // ignore bot commands
  let me = await server.guild.member(bot.owner_ID);
  let ry = await server.guild.member(ryryID);
  let riri = await server.guild.member(ririID);
  if (me.presence.status == 'offline'
      &&  (message.mentions.users.has(bot.owner_ID) 
           || message.mentions.roles.has(activeStaff))) { // If I'm offline
    notify(message, config.LINEnotifyToken);
  }
  if ((ry.presence.status == 'offline' && message.mentions.users.has(ryryID))
      || message.mentions.roles.has(activeStaff)) {
    notify(message, config.ryryLINEnotifyToken);
  }

  if (riri.presence.status == 'offline'
      &&  (message.mentions.users.has(ririID) 
           || message.mentions.roles.has(activeStaff))) { 
    notify(message, config.ririLINEnotifyToken);
  }
};

