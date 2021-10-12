const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'kick';

module.exports.alias = ['kick'];

module.exports.isAllowed = (message, server) => {
  return (
    message.member.hasPermission('ADMINISTRATOR') ||
    message.member.roles.cache.has('543721608506900480')
  );
};

module.exports.help = ',kick <member>';

module.exports.command = async (message, content, bot, server) => {
  const badPeople = [];
  const executor = message.author;
  let reason = 'Unspecified';
  content = content.replace(Util.REGEX_USER, '');
  const ids = content.match(Util.REGEX_RAW_ID);
  if (ids) {
    badPeople.push(...ids);
    content = content.replace(Util.REGEX_RAW_ID, '');
  }
  badPeople.push(...message.mentions.users.keys());
  if (badPeople.length == 0) {
    message.channel.send('Could not resolve users.');
    return;
  }

  const badIDs = [];
  const badMembers = badPeople
    .map((id) => {
      const mem = server.guild.member(id);
      if (!mem) badIDs.push(id);
      return mem;
    })
    .filter(Boolean);

  // actually ban
  if (!badMembers.every((mem) => mem.bannable)) {
    message.channel.send('They cannot be kicked');
    return;
  }
  let options = /\s?(.*)/.exec(content);
  if (options) {
    if (options[1]) {
      reason = options[1];
    }
  }

  const auditLogReason = `Issued by: ${executor.tag}. Reason: ${reason}`;
  if (auditLogReason.length > 512) {
    await message.channel.send(
      `The kick reason exceeds the limit of 512 characters: ${auditLogReason.length} characters`
    );
    return;
  }
  const bannedPeople = badPeople.map((id) => `<@${id}>`).join('\n');
  const failedBans = [];

  let banMessage = `<:hypergeralthinkban:443803651325034507>  **You are kicking**  <:hypergeralthinkban:443803651325034507>\n\n${bannedPeople}\n\n__Reason__: ${reason}\nType \`confirm\` or \`cancel\``;
  await message.channel.send(banMessage);
  const filter = (m) => m.member.id == executor.id;
  const collector = message.channel.createMessageCollector(filter, {
    time: 45000,
  });
  collector.on('collect', async (m) => {
    const resp = m.content.toLowerCase();
    if (resp === 'confirm') {
      let someBan = false;
      await Promise.all(
        badMembers.map(async (mem) => {
          try {
            await mem.send(
              `You have been kicked from ${server.guild}.\nReason: ${reason}`
            );
          } catch (e) {
            await message.channel.send(
              `Failed to DM the kick reason to ${mem}`
            );
          }
          try {
            await server.guild.members.kick(mem, {
              reason: auditLogReason,
            });
            someBan = true;
            const warning = {
              issued: message.createdTimestamp,
              issuer: message.author.id,
              link: message.url,
              warnMessage: 'Kicked: ' + reason,
            };
            if (server.warnlist[mem.id]) {
              server.warnlist[mem.id].push(warning);
            } else {
              server.warnlist[mem.id] = [warning];
            }
          } catch (e) {
            await message.channel.send(`Failed to kick ${mem}`);
            failedBans.push(mem.id);
          }
        })
      );
      await Promise.all(
        badIDs.map(async (id) => {
          try {
            await server.guild.members.kick(id, {
              reason: auditLogReason,
            });
            someBan = true;
            const warning = {
              issued: message.createdTimestamp,
              issuer: message.author.id,
              link: message.url,
              warnMessage: 'Kicked: ' + reason,
            };
            if (server.warnlist[id]) {
              server.warnlist[id].push(warning);
            } else {
              server.warnlist[id] = [warning];
            }
          } catch (e) {
            await message.channel.send(`Failed to kick <@${id}>`);
            failedBans.push(id);
          }
        })
      );
      if (someBan) {
        collector.stop('Kicked');
      } else {
        collector.stop('Failed');
      }
      return;
    }
    if (resp == 'cancel') {
      collector.stop('Cancelled');
      return;
    }
    message.channel.send('Invalid response. Type `confirm` or `cancel`');
  });
  collector.on('end', (collected, endReason) => {
    if (endReason == 'Kicked') {
      const actualBanned = badPeople.filter((p) => !failedBans.includes(p));
      message.channel.send('✅ Kicked');
      const agt = server.guild.channels.cache.get('755269708579733626');
      let embed = new Discord.MessageEmbed();
      let date = new Date();
      embed.setAuthor(`${message.author.tag}`, message.author.avatarURL());
      embed.title = 'Kick';
      embed.addField(
        'Kicked users:',
        actualBanned.map((b) => `<@${b}>`).join('\n'),
        false
      );
      embed.addField('Kick reason:', reason, false);
      embed.color = Number('0x000000');
      embed.setFooter(`In #${message.channel.name}`);
      embed.timestamp = date;
      agt.send({ embed });

      server.save();
      return;
    } else if (endReason == 'Cancelled') {
      message.channel.send('❌ Cancelled');
      return;
    } else if (endReason == 'Failed') {
      message.channel.send('❌ Unable to kick them');
      return;
    } else {
      message.channel.send('❌ Failed to confirm');
      return;
    }
  });
};
