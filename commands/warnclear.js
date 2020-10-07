const Util = require('../classes/Util.js');

module.exports.name = 'warnclear';
module.exports.alias = ['warnclear', 'unwarn'];

module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help =
  'Clear warnings on a user `,warnclear <User> [warning number]` .\nSpecify a warning number (position in the list) to clear certain warnings, otherwise clear all';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }

  let userID;
  let mentions = message.mentions.users;
  if (mentions.size != 0) {
    userID = mentions.first().id;
  } else {
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (idMatch) {
      userID = idMatch[0];
    }
  }
  if (!userID) {
    message.channel.send('Failed to get a user');
    return;
  }
  let num = content.replace(/(<@!?)?[0-9]{17,21}>?/, '').trim();
  if (num) {
    num = parseInt(num, 10);
  }

  const warnings = server.warnlist[userID];
  if (warnings) {
    const member = server.guild.members.cache.get(userID);
    if (num) {
      const warning = warnings[num - 1];
      if (warning) {
        server.warnlist[userID] = warnings.filter(
          (w) => w.issued !== warning.issued
        );
        message.channel.send(`Warning #${num} cleared for <@${userID}>`);
        if (member && !warning.silent) {
          try {
            await member.send(
              `Your warning "${warning.warnMessage}" on ${message.guild.name} has been cleared`
            );
          } catch (e) {
            message.channel.send(`<@${userID}> could not be notified`);
          }
        }
      } else {
        message.channel.send(`There's no warning number ${num}`);
      }
      return;
    }
    delete server.warnlist[userID];
    await message.channel.send(`Warnings cleared for <@${userID}>`);
    if (member) {
      try {
        await member.send(
          `All of your warnings have been cleared on ${message.guild.name}`
        );
      } catch (e) {
        message.channel.send(`<@${userID}> could not be notified`);
      }
    }
  } else {
    message.channel.send(`<@${userID}> has no warnings.`);
  }
};
