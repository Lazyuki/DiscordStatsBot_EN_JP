const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'logwarning';
module.exports.alias = [
  'log',
  'silentwarn',

];

module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Warn a user silently `,log <User> <Warning message>';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }

  let member;
  let mentions = message.mentions.members;
  if (mentions.size != 0) {
    member = mentions.first();
    content = content.replace(Util.REGEX_USER, '');
  } else {
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (idMatch) {
      member = await server.guild.member(idMatch[0]);
      content = content.replace(idMatch[0], '');
    }
  }
  if (!member) {
    message.channel.send('Failed to get a member');
    return;
  };

  content = content.trim();

  if (!content) {
    message.channel.send('There must be a warning message');
    return;
  }
  const warning = {
    issued: message.createdTimestamp,
    issuer: message.author.id,
    link: message.url,
    silent: true,
    warnMessage: content
  }

  if (server.warnlist[member.id]) {
    server.warnlist[member.id].push(
      warning
    )
  } else {
    server.warnlist[member.id] = [
      warning
    ];
  }
  message.channel.send({
    embed: new Discord.MessageEmbed()
      .setDescription(`Logged the warning for ${member} by ${message.author}. (They did not receive the warning from Ciri) `)
      .setColor('0x42f46b')
  });
  server.save();
};
