const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'ban';

module.exports.initialize = (json, server) => {
  server.banWindow = 60 * 60 * 1000; // an hour
  if (!json || !json['banWindow']) return;
  server.banWindow = json['banWindow'];
};

module.exports.alias = ['ban'];

module.exports.isAllowed = (message, server) => {
  return (
    server.guild.id == '189571157446492161' &&
    (message.member.hasPermission('ADMINISTRATOR') ||
      message.member.roles.cache.has('543721608506900480'))
  );
};

module.exports.help =
  ' `,ban [days=1] <@mentions> [reason]`\nBan!! Can specify multiple users.\nCheck out `,massban` for raids\n`,ban window N` to set the ban window to N minutes, or leave it blank to see the current window. ';

module.exports.command = async (message, content, bot, server) => {
  const badPeople = [];
  const executor = message.author;
  let deleteDays = 1;
  let reason = 'Unspecified';
  content = content.replace(Util.REGEX_USER, '');
  const ids = content.match(Util.REGEX_RAW_ID);
  if (ids) {
    badPeople.push(...ids);
    content = content.replace(Util.REGEX_RAW_ID, '');
  }
  badPeople.push(...message.mentions.users.keys());
  if (badPeople.length == 0) {
    if (message.member.hasPermission('ADMINISTRATOR')) {
      let reg = /window\s*(\d+)?/.exec(content);
      if (reg) {
        if (reg[1]) {
          let min = parseInt(reg[1]);
          server.banWindow = min * 60 * 1000;
          message.channel.send(`Ban window set to ${min} minutes`);
          return;
        } else {
          let min = server.banWindow / 60 / 1000;
          message.channel.send(`Ban window is ${min} minutes`);
          return;
        }
      }
    }
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

  if (!message.member.hasPermission('ADMINISTRATOR')) {
    // check for ban window
    const now = new Date();
    if (badMembers.some((mem) => now - mem.joinedAt > server.banWindow)) {
      message.channel.send(
        `Some are older than ${server.banWindow / 60 / 1000} minutes`
      );
      return;
    }
  }
  // actually ban
  if (!badMembers.every((mem) => mem.bannable)) {
    message.channel.send('They cannot be banned');
    return;
  }
  let options = /(\d+)?\s?(.*)/.exec(content);
  if (options) {
    if (options[1]) {
      // num of days
      deleteDays = parseInt(options[1]);
    }
    if (options[2]) {
      reason = options[2];
    }
  }

  const auditLogReason = `Issued by: ${executor.tag}. Reason: ${reason}`;
  if (auditLogReason.length > 512) {
    await message.channel.send(
      `The ban reason exceeds the limit of 512 characters: ${auditLogReason.length} characters`
    );
    return;
  }
  const bannedPeople = badPeople.map((id) => `<@${id}>`).join('\n');
  const failedBans = [];

  const deleting = deleteDays
    ? `__**Deleting**__: Messages from the past ${deleteDays} day${
        deleteDays > 1 ? 's' : ''
      }\n(type \`confirm keep\` to not delete messages)`
    : `**NOT DELETING** any messages`;
  let banMessage = `<:hypergeralthinkban:443803651325034507>  **You are banning**  <:hypergeralthinkban:443803651325034507>\n\n${bannedPeople}\n\n${deleting}\n\n__Reason__: ${reason}\nType \`confirm delete\`, \`confirm keep\` or \`cancel\``;
  await message.channel.send(banMessage);
  const filter = (m) => m.member.id == executor.id;
  const collector = message.channel.createMessageCollector(filter, {
    time: 45000,
  });
  collector.on('collect', async (m) => {
    const resp = m.content.toLowerCase();
    if (
      [
        'confirm d',
        'confirm del',
        'confirm delete',
        'confirm k',
        'confirm keep',
      ].includes(resp)
    ) {
      if (resp.startsWith('confirm k')) {
        deleteDays = 0;
      }
      let someBan = false;
      await Promise.all(
        badMembers.map(async (mem) => {
          try {
            await mem.send(
              `You have been banned from ${server.guild}.\nReason: ${reason}`
            );
          } catch (e) {
            await message.channel.send(`Failed to DM the ban reason to ${mem}`);
          }
          try {
            await server.guild.members.ban(mem, {
              days: deleteDays,
              reason: auditLogReason,
            });
            someBan = true;
            const warning = {
              issued: message.createdTimestamp,
              issuer: message.author.id,
              link: message.url,
              warnMessage: 'Banned: ' + reason,
            };
            if (server.warnlist[mem.id]) {
              server.warnlist[mem.id].push(warning);
            } else {
              server.warnlist[mem.id] = [warning];
            }
          } catch (e) {
            await message.channel.send(`Failed to ban ${mem}`);
            failedBans.push(mem.id);
          }
        })
      );
      await Promise.all(
        badIDs.map(async (id) => {
          try {
            await server.guild.members.ban(id, {
              days: deleteDays,
              reason: auditLogReason,
            });
            someBan = true;
            const warning = {
              issued: message.createdTimestamp,
              issuer: message.author.id,
              link: message.url,
              warnMessage: 'Banned: ' + reason,
            };
            if (server.warnlist[id]) {
              server.warnlist[id].push(warning);
            } else {
              server.warnlist[id] = [warning];
            }
          } catch (e) {
            await message.channel.send(`Failed to ban <@${id}>`);
            failedBans.push(id);
          }
        })
      );
      if (someBan) {
        collector.stop('Banned');
      } else {
        collector.stop('Failed');
      }
      return;
    }
    if (resp == 'cancel') {
      collector.stop('Cancelled');
      return;
    }
    message.channel.send(
      'Invalid response. Type `confirm delete`, `confirm keep` or `cancel`'
    );
  });
  collector.on('end', (collected, endReason) => {
    if (endReason == 'Banned') {
      const actualBanned = badPeople.filter((p) => !failedBans.includes(p));
      message.channel.send('✅ Banned');
      const agt = server.guild.channels.cache.get('755269708579733626');
      let embed = new Discord.MessageEmbed();
      let date = new Date();
      embed.setAuthor(`${message.author.tag}`, message.author.avatarURL());
      embed.title = 'Ban';
      embed.addField(
        'Banned users:',
        actualBanned.map((b) => `<@${b}>`).join('\n'),
        false
      );
      embed.addField('Ban reason:', reason, false);
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
      message.channel.send(
        "❌ Unable to ban them. Make sure the number of days is set appropriately and the ban message isn't too long"
      );
      return;
    } else {
      message.channel.send('❌ Failed to confirm');
      return;
    }
  });
};
