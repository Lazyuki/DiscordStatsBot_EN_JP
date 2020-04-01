module.exports.name = 'pruneMessages';

module.exports.alias = [
  'prune'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id === '292389599982911488') {
    return server.hiddenChannels.includes(message.channel.id);
  }
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '__Mods Only__ Deletes messages sent by specified users in the channel in the past 24 hours. Use their IDs. `,prune <#123454323454> 2345432345643 4543246543234 -h 10`\nUse `-h` for number of hours (24 by default)';

const Util = require('../classes/Util');

module.exports.command = async (message, content, bot, server) => {
  if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
    message.channel.send('I need the Mangae Messages permission.');
    return;
  }
  const channelIdsMatches = /<#([0-9]+)>/g.exec(content);
  content = content.replace(Util.REGEX_CHAN, '');
  const channel= channelIdsMatches ? server.guild.channels.get(channelIdsMatches[0]) : message.channel;
  const hourMatches = /-h ([0-9]+)/g.exec(content);
  content = content.replace(/-h ([0-9]+)/, '');
  const hour = hourMatches ? parseInt(hourMatches[0]) : 24;
  var ids = content.trim().split(' ');
  var lastMessageID = message.id;
  var done = false;
  var now = (new Date()).getTime();
  var day = hour * 60 * 60 * 1000;
  var count = 0;
  var delCount = 0;
  while (!done) {
    let messages = await channel.fetchMessages({limit:100,before:lastMessageID});
    let delMsgs = [];
    let num = 0;
    for (var m of messages.values()) {
      count++;
      if (++num == 100) {
        if (now - m.createdAt.getTime() > day) {
          done = true;
          break;
        } else {
          lastMessageID = m.id;
        }
      }
      if (ids.indexOf(m.author.id) != -1) {
        delMsgs.push(m);
        delCount++;
      }
    }
    if (delMsgs.length > 0) {
      channel.bulkDelete(delMsgs);
    }
  }
  message.channel.send(`Checked ${count} messages and deleted ${delCount} messages!`);
};
