const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'message';
module.exports.alias = ['message', 'msg'];

module.exports.isAllowed = (message, server) => {
  return message.member.hasPermission('BAN_MEMBERS');
};

module.exports.help = 'DM a user';

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
  }

  content = content.trim();

  if (!content) {
    message.channel.send('There must be a message');
    return;
  }

  const embed = new Discord.MessageEmbed();
  embed.title = `Message from ${server.guild.name}`;
  embed.description = content;
  embed.color = Number('0x2F3136');
  embed.setFooter(
    'You cannot reply to this message. Please talk to the moderators directly if you wish to discuss further'
  );

  member
    .send({ embed })
    .then((m) => {
      message.channel.send({
        embed: new Discord.MessageEmbed()
          .setDescription(`The message has been sent to ${member}`)
          .setColor('0x42f46b'),
      });
    })
    .catch((e) => {
      message.channel.send({
        embed: new Discord.MessageEmbed()
          .setDescription(
            `Failed to DM ${member.user.tag}. Their don't allow DMs from people on this server.`
          )
          .setColor('0xDB3C3C'),
      });
    });
};
