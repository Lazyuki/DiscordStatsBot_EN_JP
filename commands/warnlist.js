const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.name = 'warnlist';
module.exports.alias = [
  'warnlist',
  'warnlog',
  'wl'
];

module.exports.isAllowed = (message, server) => {
  return server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = 'Warnings for the user `,warnlist [User]`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    const warnings = server.warnlist;
    const list = [];
    for (let u of Object.keys(warnings)) {
      const warns = warnings[u].length;
      const user = await bot.fetchUser(u);
      list.push(`<@${u}> ${user.tag}: ${warns} warning${warns === 1 ? '' : 's'}`)
    }
    Util.paginate(message.channel, 'All warnings', list, 10, message.author.id)
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
  };

  if (server.warnlist[userID]) {
    const warnings = server.warnlist[userID];
    const embed = new Discord.RichEmbed();
    let member;
    try {
      member = await server.guild.member(userID);
    } catch {
      member = null
    }
    embed.title = `Warning list for ${member ? member.user.tag : userID}`;
    embed.color = Number('0xDB3C3C');
    let count = 0;
    for (let { issued, issuer, warnMessage, link, silent } of warnings) {
      let issuerMember;
      try {
        issuerMember = await server.guild.member(issuer);
      } catch {
        issuerMember = null;
      }
      
      if (link) {
        warnMessage += `\n[jump](${link})`;
      }
      if (silent) {
        warnMessage += `\n(Silently logged)`;
      }
      if (++count > 25) {
        await message.channel.send({ embed });
        embed.fields = [];
        count = 1;
      }
      embed.addField(`${new Date(issued).toGMTString()} by ${issuerMember ? issuerMember.user.tag : issuer }`, warnMessage, false);
    } 
    message.channel.send({ embed })
  } else {
    message.channel.send('No warnings found');
  }
};
