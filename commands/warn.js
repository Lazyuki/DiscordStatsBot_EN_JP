const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'warn';
module.exports.alias = [
  'warn'
];
module.exports.initialize = (json, server) => {
  server.warnlist = {};
  if (!json || !json['warnlist']) return;
  server.warnlist = json['warnlist'];
};

module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Warn a user `,warn <User> <Warning message>`';

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

  const warning = {
    issued: message.createdTimestamp,
    issuer: message.author.id,
    warnMessage: content.trim()
  }

  const embed = new Discord.MessageEmbed();
  embed.title = `You have been warned on ${server.guild.name}`;
  embed.description = warning.warnMessage;
  embed.color = Number('0xDB3C3C');
  embed.timestamp = new Date();

  member.send({ embed })
    .then(m => {
      message.channel.send({
        embed: new Discord.MessageEmbed()
          .setDescription(`${member} has been warned by ${message.author}`)
          .setColor('0x42f46b')
      });
    })
    .catch(e => {
      message.channel.send({
        embed: new Discord.MessageEmbed()
            .setDescription(`Failed to DM ${member.user.tag}. The user couldn't receive the warning.`)
            .setColor('0xDB3C3C')
        });
    });

  if (server.warnlist[member.id]) {
    server.warnlist[member.id].push(
      warning
    )
  } else {
    server.warnlist[member.id] = [
      warning
    ];
  }
  server.save();
};
