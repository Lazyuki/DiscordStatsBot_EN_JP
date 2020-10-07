module.exports.name = 'addMessages';
module.exports.events = ['NEW'];

const UserRecord = require('../classes/UserRecord.js');
const Utils = require('../classes/Util.js');

module.exports.initialize = (json, server) => {
  server.today = 0;
  server.users = {};
  if (!json || !json['users']) return;
  server.today = json['today'];
  for (let user in json['users']) {
    let uRec = json['users'][user];
    server.users[user] = new UserRecord(uRec);
  }
};
module.exports.isAllowed = (message, server) => {
  return (
    !server.ignoredChannels.includes(message.channel.id) &&
    !/^(?:[trkhHm]?q?!|[.&;+>$%;=\]])/.test(message.content)
  );
};

module.exports.process = async function (message, server, bot, language) {
  let author = message.author.id;
  let channel = message.channel.id;
  if (!server.users[author]) {
    server.users[author] = new UserRecord();
  }
  let userRec = server.users[author];
  userRec.add(message.content, channel, server.today, language);
  let emotes = message.content.match(Utils.REGEX_CUSTOM_EMOTES);
  if (emotes) {
    for (let emote of emotes) {
      userRec.addReacts(emote, server.today);
    }
  }
  let emojis = message.content.match(Utils.REGEX_EMOJIS);
  if (emojis) {
    for (let c of emojis) {
      userRec.addReacts(c, server.today);
    }
  }
  if (message.guild.id !== '189571157446492161') return;
  if (message.mentions.members.size > 15) {
    // SPAM alert!
    let modlog = server.guild.channels.get('366692441442615306'); // #mod_log
    if (server.mentionspam === message.author.id) {
      // give one chance
      message.member.addRole('259181555803619329'); // muted role
      message.channel.send(
        `**USER MUTED** ${message.author} has been muted for possible spamming (mentioning 15+ people). <@&240647591770062848> if this was a mistake, unmute them by removing the mute tag. If not, BAN THEM!`
      );
    } else {
      server.mentionspam = message.author.id;
      modlog.send(
        `**POSSIBLE SPAM ALERT** (15+ mentions) by ${message.author} in ${message.channel} !`
      );
    }
  }
};
