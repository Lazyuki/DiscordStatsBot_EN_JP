const Util = require('../classes/Util.js');
module.exports.name = 'selfMute';
module.exports.alias = ['selfmute', 'sm'];

async function unmute(user_id, server) {
  let member = server.guild.members.cache.get(user_id);
  if (!member) {
    try {
      member = await server.guuild.members.fetch(user_id);
    } catch (e) {
      console.error(`Could not unmute ${user_id}. Failed to fetch member`, e);
      delete server.selfmutes[user_id];
      return;
    }
  }
  try {
    await member.roles.remove(server.selfmuteRoles);
    delete server.selfmutes[user_id];
  } catch (e) {
    console.error(`Failed to remove selfmute roles for ${user_id}`, e);
    setTimeout(() => {
      unmute(user_id, server);
    }, 180000); // Try 3 minutes later
  }
}

module.exports.initialize = (json, server) => {
  server.selfmutes = {};
  server.selfmuteRoles = [];
  if (!json) return;
  if (json['selfmutes']) {
    server.selfmutes = json['selfmutes'];
    for (const user_id in server.selfmutes) {
      const time = server.selfmutes[user_id];
      setTimeout(
        () => unmute(user_id, server),
        new Date(time).getTime() - new Date().getTime()
      );
    }
  }
  if (json['selfmuteRoles']) {
    server.selfmuteRoles = json['selfmuteRoles'];
  }
};

module.exports.isAllowed = (message, server) => {
  return (
    server.guild.id === '189571157446492161' ||
    (server.selfmuteRoles && server.selfmuteRoles.length) ||
    message.content.includes('set')
  );
};

module.exports.help =
  "Mute yourself (text and voice) in the server. Mods can't unmute you so don't message them. `,selfmute 1d20h43m4s`";

const TIME_REGEX = /([0-9]+d)?([0-9]+h)?([0-9]+m)?([0-9]+s)?/;
const SECRET_REGEX = /remove <?@?!?([0-9]+)>?/;
const SETTINGS_REGEX = /set (?:<?@?&?([0-9]+)>? ?)+/;

module.exports.command = async (message, content, bot, server) => {
  let matches = SECRET_REGEX.exec(content);
  if (matches && message.member.hasPermission('ADMINISTRATOR')) {
    const user_id = matches[1];
    unmute(user_id, server);
    message.channel.send(`✅  Unselfmuted`);
    return;
  }

  matches = SETTINGS_REGEX.exec(content);
  if (matches && message.member.hasPermission('ADMINISTRATOR')) {
    const discordIDs = content.match(Util.REGEX_RAW_ID);
    server.selfmuteRoles = discordIDs;
    message.channel.send(
      `✅ Set selfmute roles to ${discordIDs.map((d) => `<@&${d}>`).join(', ')}`
    );
    return;
  }

  matches = TIME_REGEX.exec(content);
  if (!matches) {
    message.channel.send(
      'Invalid time syntax. Only `d`, `h`, `m`, and `s` are supported. '
    );
    return;
  }
  const member = message.member;
  let days = parseInt(matches[1] || 0);
  let hours = parseInt(matches[2] || 0);
  let minutes = parseInt(matches[3] || 0);
  let seconds = parseInt(matches[4] || 0);
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds %= 60;
  }
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes %= 60;
  }
  if (hours >= 24) {
    days += Math.floor(hours / 24);
    hours %= 24;
  }
  const totalSeconds = seconds + minutes * 60 + hours * 3600 + days * 86400;
  if (totalSeconds > 259200) {
    message.channel.send("You can't mute yourself for more than 3 days");
    return;
  } else if (totalSeconds < 60) {
    message.channel.send("You can't mute yourself for under a minute");
    return;
  }
  const totalMillis = totalSeconds * 1000;
  const unmuteDateMillis = new Date().getTime() + totalMillis;
  server.selfmutes[member.id] = unmuteDateMillis;
  server.save();

  await message.member.roles.add(server.selfmuteRoles, 'Selfmuted');
  setTimeout(() => unmute(member.id, server), totalMillis);

  message.channel.send(
    `✅ ${message.author.username} self muted for ${
      days ? `${days} days ` : ''
    }${hours ? `${hours} hours ` : ''}${minutes ? `${minutes} minutes ` : ''}${
      seconds ? `${seconds} seconds` : ''
    } `
  );
};
