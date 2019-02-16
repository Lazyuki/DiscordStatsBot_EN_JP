const Discord = require('discord.js');
const Util = require('../classes/Util.js');
module.exports.name = 'ban';

module.exports.initialize = (json, server) => {
  server.banWindow = 60 * 60 * 1000; // an hour
  if (!json || !json['banWindow']) return;
  server.banWindow = json['banWindow'];
};

module.exports.alias = [
  'ban'
];

module.exports.isAllowed = (message, server) => {
  return server.guild.id == '189571157446492161' && (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.has('543721608506900480'));
};

module.exports.help = '__Mods Only__ `,ban [days=1] <@mentions> [reason]`\nBan!! Can specify multiple users. \n`,ban window N` to set the ban window to N minutes, or leave it blank to see the current window. ';

module.exports.command = async (message, content, bot, server) => {
  let badPeople = [];
  const executor = message.member;
  let deleteDays = 1;
  let reason = 'Unspecified';
  content = content.replace(Util.REGEX_USER, '');
  let ids = content.match(Util.REGEX_RAW_ID);
  if (ids) {
    for (let id of ids) {
      let mem = server.guild.member(id);
      if (mem) {
        badPeople.push(mem);
      }
    }
    content = content.replace(Util.REGEX_RAW_ID, '');
  }
  badPeople.push(...message.mentions.members.array());
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

  if (!message.member.hasPermission('ADMINISTRATOR')) { // check for ban window
    const now = new Date();
    if (badPeople.some(mem =>  now - mem.joinedAt > server.banWindow)) {
      message.channel.send(`They are older than ${server.banWindow / 60 / 1000} minutes`);
      return;
    }
  }
  // actually ban
  if (!badPeople.every(mem => mem.bannable)) {
    message.channel.send('They cannot be banned');
    return;
  }
  let options = /(\d+)?\s?(.*)/.exec(content);
  if (options) {
    if (options[1]) { // num of days
      deleteDays = parseInt(options[1]);
    }
    if (options[2]) {
      reason = options[2];
    }
  }
  let banMessage = `<:hypergeralthinkban:443803651325034507> **You are banning** <:hypergeralthinkban:443803651325034507>\n${badPeople.reduce((s, mem) => `${s}${mem}\n`, '')}**Reason**: ${reason}\nType \`confirm\` or \`cancel\``;
  await message.channel.send(banMessage);
  const filter = m => m.member.id == executor.id;
  const collector = message.channel.createMessageCollector(filter, { time: 15000 });
  collector.on('collect', m => {
    if (m.content.toLowerCase() == 'confirm') {
      badPeople.forEach(async mem =>  {
        await mem.send(`You have been banned from ${server.guild}.\nReason: ${reason}`);
        mem.ban({ days: deleteDays, reason: `Issued by: ${executor.tag}. Reason: ${reason}` })
          .catch(() => {
            collector.stop('Failed');
            return;
          });
      });
      collector.stop('Banned');
      return;
    }
    if (m.content.toLowerCase() == 'cancel') {
      collector.stop('Cancelled');
      return;
    }
    message.channel.send('Invalid response');
  });
  collector.on('end', (collected, endReason) => {
    if (endReason == 'Banned') {
      message.channel.send('✅ Banned');
      const ewbf = server.guild.channels.get('277384105245802497');
      let embed = new Discord.MessageEmbed();
      let date = new Date();
      embed.setAuthor(`${message.author.tag}`,message.author.avatarURL());
      embed.title = 'Ban';
      embed.addField('Banned users:', `${badPeople.reduce((s, mem) => `${s}${mem}: ${mem.id}\n`, '')}`, false);
      embed.addField('Ban reason:', `${reason}`, false);
      embed.color = Number('0xff283a');
      embed.setFooter(`In #${message.channel.name}`);
      embed.timestamp = date;
      ewbf.send({embed});
      return;
    } else if (endReason == 'Cancelled') {
      message.channel.send('❌ Cancelled');
      return;
    } else if (endReason == 'Failed') {
      message.channel.send('❌ Unable to ban them. Make sure the number of days is set appropriately and the ban message isn\'t too long');
      return;
    } else {
      message.channel.send('❌ Failed to confirm');
      return;
    }
  });
};
