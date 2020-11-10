const Discord = require('discord.js');
const Util = require('../classes/Util');

module.exports.name = 'tempMute';
module.exports.alias = ['tempmute', 'tm', 'shutup', 'timeout'];

function unmute(user_id, server) {
  server.guild.members
    .fetch(user_id)
    .then((member) => {
      member.roles.remove([CHAT_MUTED, VOICE_BANNED]);
    })
    .catch((e) => {
      // member no longer exists
    });
  if (user_id in server.tempmutes) delete server.tempmutes[user_id];
}

module.exports.initialize = (json, server) => {
  server.tempmutes = {};
  if (!json || !json['tempmutes']) return;
  server.tempmutes = json['tempmutes'];
  for (const user_id in server.tempmutes) {
    const time = server.tempmutes[user_id];
    Util.runAt(new Date(time), () => unmute(user_id, server));
  }
};

module.exports.isAllowed = (message, server) => {
  return (
    server.guild.id === '189571157446492161' &&
    message.member.hasPermission('MUTE_MEMBERS')
  );
};

module.exports.help =
  'Mute users temporarily. `,tm <mentions or IDs> [time. Defaults to 5m] [reason]`\nExample: `,tm @someone @sometwo 3d1h30m shhhhhhhh`';

const CHAT_MUTED = '259181555803619329';
const VOICE_BANNED = '327917620462354442';
const VOICE_MUTED = '357687893566947329';
const TIME_REGEX = /([0-9]+d)?([0-9]+h)?([0-9]+m)?([0-9]+s)?/;

/**
 *
 * @param {String} content
 * @param {Guild} guild
 * @returns {[Member, String]}
 */
function getNextPossibleMember(content, guild) {
  const firstWord = content.split(/(\s|><)+/)[0];
  const idMatches = /[0-9]{17,22}/.exec(firstWord);
  if (idMatches) {
    const id = idMatches[0];
    try {
      const mem = guild.members.cache.get(id) || null;
      return [mem, content.substr(firstWord.length + 1).trim()];
    } catch (e) {
      return [null, content.substr(firstWord.length + 1).trim()];
    }
  } else {
    return [null, null];
  }
}

/**
 *
 * @param {String} content
 * @param {Guild} guild
 * @returns {[Member[], String]}
 */
function getAllMembers(content, guild) {
  let currContent = content;
  const members = [];
  while (currContent) {
    const [mem, nextContent] = getNextPossibleMember(currContent, guild);
    if (mem) {
      members.push(mem);
    }
    if (nextContent === null) {
      break;
    }
    currContent = nextContent;
  }
  return [members, currContent];
}

module.exports.command = async (message, content, bot, server) => {
  const [members, restContent] = getAllMembers(content.trim(), server.guild);
  if (members.length === 0) {
    message.channel.send('You need to specify members');
    return;
  }
  let timeMatches = TIME_REGEX.exec(restContent);
  if (!timeMatches[0]) {
    timeMatches = [null, 0, 0, 5, 0];
  }
  let days = parseInt(timeMatches[1] || 0);
  let hours = parseInt(timeMatches[2] || 0);
  let minutes = parseInt(timeMatches[3] || 0);
  let seconds = parseInt(timeMatches[4] || 0);
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
  if (totalSeconds > 2592000) {
    message.channel.send("You can't mute them for more than a month");
    return;
  } else if (totalSeconds < 60) {
    message.channel.send("You can't mute them for under a minute");
    return;
  }
  const totalMillis = totalSeconds * 1000;
  const unmuteDateMillis = new Date().getTime() + totalMillis;
  const reason = restContent.replace(TIME_REGEX, '').trim();
  const durationString = `${days ? `${days} days ` : ''}${
    hours ? `${hours} hours ` : ''
  }${minutes ? `${minutes} minutes ` : ''}${
    seconds ? `${seconds} seconds` : ''
  }`;
  const embed = new Discord.MessageEmbed();
  embed.setAuthor(`Temporarily Muted in ${message.guild.name}`);
  embed.description = `You are muted for ${durationString}\nReason: ${
    reason || 'unspecified'
  }`;
  embed.color = Number('0xEC891D');
  embed.timestamp = new Date();
  for (const member of members) {
    server.tempmutes[member.id] = unmuteDateMillis;

    try {
      if (member.voice.channel) {
        await member.voice.kick();
      }
      await member.roles.add([CHAT_MUTED, VOICE_BANNED], 'Temp Muted');
      await member.send({ embed });
    } catch (e) {
      // already muted
    }

    Util.runAt(new Date(unmuteDateMillis), () => unmute(member.id, server));
    const warning = {
      issued: message.createdTimestamp,
      issuer: message.author.id,
      link: message.url,
      warnMessage: 'Temp muted' + (reason ? `: ${reason}` : ''),
    };
    if (server.warnlist[member.id]) {
      server.warnlist[member.id].push(warning);
    } else {
      server.warnlist[member.id] = [warning];
    }
  }
  await message.channel.send(
    `✅ Muted ${members.map((m) => m).join(', ')} for ${durationString}${
      reason ? `\nReason: ${reason}` : ''
    }`
  );
  const agt = server.guild.channels.cache.get('755269708579733626');
  embed.setAuthor('Temporarily Muted', message.author.avatarURL());
  embed.description = `Duration: ${durationString}\nReason: ${
    reason || 'unspecified'
  }\nMembers: ${members.map((m) => `${m}: (${m.user.tag})`).join('\n')}`;
  embed.setFooter(`In: #${message.channel.name}`);
  agt.send({ embed });
};
