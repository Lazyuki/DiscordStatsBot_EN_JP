const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'warn';
module.exports.alias = ['warn'];
module.exports.initialize = (json, server) => {
  server.warnlist = {};
  if (!json || !json['warnlist']) return;
  server.warnlist = json['warnlist'];
};

module.exports.isAllowed = (message, server) => {
  return (
    server.hiddenChannels.includes(message.channel.id) ||
    (server.guild.id === '189571157446492161' &&
      (message.member.hasPermission('BAN_MEMBERS') ||
        message.member.roles.cache.has('543721608506900480')))
  );
};

module.exports.help =
  'Warn a user `,warn <User> <Warning message> [ -n ]`\nUse `-n` to not send the warning DM.';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify a user with an ID or mention them');
    return;
  }

  const dontSendDM = /\s?-[ns]\b/.test(content);

  if (dontSendDM) {
    content = content.replace(/\s-[ns]\b/, '');
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
    message.channel.send('There must be a warning message');
    return;
  }
  const warning = {
    issued: message.createdTimestamp,
    issuer: message.author.id,
    link: message.url,
    silent: dontSendDM,
    warnMessage: content,
  };

  const embed = new Discord.MessageEmbed();
  embed.title = `You have been officially warned on ${server.guild.name}`;
  embed.description = warning.warnMessage;
  embed.color = Number('0xDB3C3C');
  embed.timestamp = new Date();

  if (!dontSendDM) {
    member
      .send({ embed })
      .then((m) => {
        message.channel.send({
          embed: new Discord.MessageEmbed()
            .setDescription(`${member} has been warned by ${message.author}`)
            .setColor('0x42f46b'),
        });
      })
      .catch((e) => {
        message.channel.send({
          embed: new Discord.MessageEmbed()
            .setDescription(
              `Failed to DM ${member.user.tag}. The user couldn't receive the warning.`
            )
            .setColor('0xDB3C3C'),
        });
        warning.warnMessage += '\n(DM Failed)';
        if (server.guild.id === '189571157446492161') {
          message.channel.send(
            'Would you like to send the warning in <#225828894765350913> and ping them? Type `confirm` or `cancel`'
          );
          const filter = (m) => m.member.id == message.author.id;
          const collector = message.channel.createMessageCollector(filter, {
            time: 45000,
          });
          collector.on('collect', async (m) => {
            const resp = m.content.toLowerCase();
            if (['confirm'].includes(resp)) {
              collector.stop('sent');
              const botMessage = await server.guild.channels.cache
                .get('225828894765350913')
                .send(
                  `<@${member.id}> We could not send this warning as a DM because of your privacy settings. Contact <@713245294657273856> if you think this is a mistake.`,
                  { embed }
                );
              const successEmbed = new Discord.MessageEmbed();
              successEmbed.description = `✅ Warning sent in <#225828894765350913>. ([Jump](${botMessage.url}))`;
              successEmbed.color = Number('0x4bf542');
              message.channel.send({ embed: successEmbed });
              warning.warnMessage +=
                '(Messaged in <#225828894765350913> instead)';
            } else if (resp === 'cancel') {
              collector.stop('cancelled');
              m.react('✅');
              return;
            }
          });
        }
      });
  } else {
    message.channel.send({
      embed: new Discord.MessageEmbed()
        .setDescription(
          `Logged the warning for ${member} by ${message.author}. (They did not receive the warning from Ciri) `
        )
        .setColor('0x42f46b'),
    });
  }

  if (server.warnlist[member.id]) {
    server.warnlist[member.id].push(warning);
  } else {
    server.warnlist[member.id] = [warning];
  }
  server.save();
};
