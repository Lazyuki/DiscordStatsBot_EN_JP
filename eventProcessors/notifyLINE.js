module.exports.name = 'notifyLINE';
module.exports.events = ['NEW'];


module.exports.isAllowed = (message, server, bot) => {
  return message.mentions.users.has(bot.owner_ID) || message.mentions.roles.has('240647591770062848');
};

const LINE = require('@line/bot-sdk');
const config = require('../config.json');
const LINEclient = new LINE.Client({
  channelAccessToken: config.LINEchannelAccessToken
});

module.exports.process = async (message, server, bot) => {
  let me = await server.guild.fetchMember(bot.owner_ID);
  if (me.presence.status != 'offline') return; // if I'm online
  if (message.content.startsWith('t!')) return; // ignore tatsumaki commands
  const LINEmsg = [];
  LINEmsg.push({
    type: 'text',
    text: `${message.cleanContent} | in #${message.channel.name} by ${message.author.username}`
  });
  LINEclient.pushMessage(config.LINEuserID, LINEmsg)
    .catch((err) => {
      console.error(err);
    });
};
