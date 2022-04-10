module.exports.name = 'addDeletedMessages';
module.exports.events = ['DELETE'];

const SimpleMsg = require('../classes/SimpleMessage.js');
const Util = require('../classes/Util.js');
const UserRecord = require('../classes/UserRecord.js');

module.exports.initialize = (json, server) => {
  server.deletedMessages = [];
  server.modLog = '';
  if (!json) return;
  if (json['deletedMessages']) {
    for (var msg in json['deletedMessages']) {
      let dm = json['deletedMessages'][msg];
      server.deletedMessages.push(new SimpleMsg({ simple: dm }));
    }
  }
  if (json['modLog']) {
    server.modLog = json['modLog'];
  }
};
module.exports.isAllowed = (message) => {
  if (
    ![
      '189571157446492161',
      '206599473282023424',
      '294931740122939392',
      '292389599982911488',
    ].includes(message.guild.id)
  )
    return false;
  return true;
};

const BOT_PREFIXES = /^(?:[trkhHm]?q?!|[.&+>$%;=\]])/;

function addDeleteRecord(message, server) {
  // ignored channel and bot prefix
  if (
    server.ignoredChannels.includes(message.channel.id) ||
    BOT_PREFIXES.test(message.content)
  )
    return;

  const diffMillis = new Date().getTime() - message.createdTimestamp;
  // message created more than 30 days ago
  if (diffMillis > 2592000000) return;

  const author_id = message.author.id;
  if (!server.users[author_id]) {
    server.users[author_id] = new UserRecord();
  }
  const userRec = server.users[author_id];
  const serverDay =
    (server.today + 31 - Math.floor(diffMillis / 86400000)) % 31;
  userRec.addDelete(serverDay);
}

module.exports.process = async function (message, server) {
  return;
  addDeleteRecord(message, server);
  if (server.guild.id === '292389599982911488') return; // mainichi
  let con = message.content;
  var imageURL = '';
  if (message.attachments.size > 0) {
    imageURL = message.attachments.first().url;
    message.content += `\n{Attachment (expired): ${imageURL} }`;
  } else if (message.content.length < 3) {
    return;
  }
  var simple = new SimpleMsg({ message: message, del: true });
  var arr;
  if (server.watchedUsers.includes(message.author.id)) {
    let timeout = 0;
    if (simple.dur < 5) {
      timeout = 5 - simple.dur * 1000;
    }
    setTimeout(function () {
      let index = server.watchedImagesID.indexOf(message.id);
      if (index != -1) {
        simple.img = server.watchedImagesLink[index];
      }
      Util.postLogs(simple, server);
    }, timeout);
  } else {
    if (
      con.startsWith('.') ||
      con.startsWith('t!') ||
      con.startsWith(',') ||
      con.startsWith('k!') ||
      con.startsWith('&') ||
      con.startsWith('!')
    )
      return; // no bot messages
    arr = server.deletedMessages;
    // Move the next two outside of the brackets if you don't want to post.
    arr.push(simple);
    if (arr.length > 30) arr.shift();
  }
  if (
    message.guild.id == '206599473282023424' ||
    message.guild.id == '294931740122939392'
  )
    return; // ignore eikyuu's server
  if (message.mentions.members.size > 10) {
    // SPAM alert!
    let chan = server.guild.channels.cache.get('366692441442615306'); // #mod_log
    if (chan == undefined) return;
    if (server.watchedUsers.includes(message.author.id)) {
      message.member.roles.add('259181555803619329'); // muted role
      chan.send(
        `**USER MUTED** ${message.author} has been muted. <@&240647591770062848> if this was a mistake, unmute them by removing the mute tag. If not, BAN THEM!`
      );
    } else {
      server.watchedUsers.push(message.author.id);
      chan.send(
        `**POSSIBLE SPAM ALERT** (deleting a message with 10+ mentions) by ${message.author} in ${message.channel} ! Automatically added to the watchlist`
      );
    }
  }
};
