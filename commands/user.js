module.exports.name = 'user';

module.exports.alias = [
  'user',
  'u'
];
module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,u [name, @mention]` Defaults to the invoked user. Note that the name search only works if the user has said something in the past 30 days. Else, @mention them.';

const Discord = require('discord.js');
const Util = require('../classes/Util.js');
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports.command = async (message, content, bot, server) => {
  let user = content == '' ? message.author : await Util.searchUser(message, content, server, bot);
  let record;
  let member;
  if (!user) {
    if (!(record = server.users[content])) {
      message.react('❓');
      return;
    }
  } else {
    record = server.users[user.id];
    member = await server.guild.member(user.id);
    
    if (record == undefined) { // the user hasn't sent anything in the past 30 days
      let embed = new Discord.RichEmbed();
      embed.title = `Stats for ${user.tag}`;
      embed.description = 'Hasn\'t said anything in the past 30 days';
      embed.color = Number('0x3A8EDB');
      if (member) { // ban check
        embed.setFooter('Joined ');
        embed.timestamp = member.joinedAt;
      }
      message.channel.send({embed});
      return;
    }
  }

  let chans = record.chans;
  let ignoreHidden = !server.hiddenChannels.includes(message.channel.id);

  // Most active channels
  let topChannels = [];
  for (let ch in chans) {
    if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
    topChannels.push([ch, chans[ch]]);
  }
  topChannels.sort(function(a, b) {
    return b[1] - a[1];
  });
  let topChans = '';
  for (let i = 0; i < 3 && i < topChannels.length; i++) {
    let perc = (topChannels[i][1] / record.thirty * 100).toFixed(1);
    let channel = server.guild.channels.get(topChannels[i][0]);
    if (!channel) continue;
    topChans += '**#' + channel.name + '** : ' + perc + '%\n';
  }

  // Most active day
  let d = new Date().getUTCDay(); // Sunday = 0, do not count today.
  let dayArr = [0, 0, 0, 0, 0, 0, 0]; // Su Mo Tu We Th Fr Sa
  let daySum = 0;
  let count = 0;
  let week = 0;
  for (let i = server.today; i >= server.today - 28; i--) { // 4 weeks
    let chans = record.record[(i + 31) % 31]; // for under flows
    for (let ch in chans) {
      if (ch == 'jpn' || ch == 'eng' || ch == 'vc' || ch == 'rxn') continue;
      if (count < 7) week += chans[ch];
      dayArr[d] += chans[ch];
      daySum += chans[ch];
    }
    count++;
    d = ((d - 1) % 7 + 7) % 7;
  }
  let maxDayNum = 0;
  let maxDay = 0;
  for (let j = 0; j < 7; j++) {
    if (dayArr[j] > maxDayNum) {
      maxDayNum = dayArr[j];
      maxDay = j;
    }
  }

  // Most used emotes
  let topEmotesArr = [];
  let emotes = record.totalReactions();
  for (let emote in emotes) {
    topEmotesArr.push([emote, emotes[emote]]);
  }
  topEmotesArr.sort(function(a, b) {
    return b[1] - a[1];
  });
  let topEmotes = '';
  let nameRegex = /<a?(:[\S]+:)(\d+)>/;
  for (let i = 0; i < 3 && i < topEmotesArr.length; i++) {
    let name = topEmotesArr[i][0];
    let regMatch = name.match(nameRegex);
    if (regMatch && !bot.emojis.has(regMatch[2])) name = regMatch[1];
    topEmotes += `${name} ${topEmotesArr[i][1]} times\n`;
  }

  // Deleted percentage
  const delPercentage = record.del / record.thirty * 100;

  let hours = Math.floor(record.vc / 60); 
  let vcTime = `${hours ? hours + 'hr '  : ''}${record.vc % 60}min`;

  let embed = new Discord.RichEmbed();
  let jp = false;
  if (user) {
    let fire = member && member.roles.has('384286851260743680');
    jp = member && (member.roles.has('196765998706196480') || member.roles.has('292401145752846337')) ;
    embed.setAuthor(`${fire ? '🔥' : ''}Stats for ${user.tag}${member && member.nickname ? ' aka ' + member.nickname : ''}` , user.avatarURL);
    embed.color = fire ? Number('0xFF5500') : Number('0x3A8EDB');
    if (member) {
      embed.setFooter('Joined this server');
      embed.timestamp = member.joinedAt;
    } else {
      embed.setFooter('Already left this server');
    }
  } else { // user left
    embed.setAuthor(`Stats for <@${content}>`);
    embed.color = Number('0x3A8EDB');
    embed.setFooter('Already left this server');
  }
  embed.description = 'For the last 30 days (UTC time)';
  let jpnPercent = jp ? (record.en / (record.jp + record.en) * 100).toFixed(2) : (record.jp / (record.jp + record.en) * 100).toFixed(2);
  embed.addField('Messages sent M | W', `${record.thirty} | ${week}`, true);
  if (server.guild.id != '206599473282023424' && !isNaN(jpnPercent)) embed.addField(jp ? 'English usage' : 'Japanese usage', jpnPercent + '%', true); // ignore Eikyuu server
  embed.addField('Time spent in VC', vcTime , true);
  embed.addField('Deleted', `${Math.max(delPercentage).toFixed(2)}%`, true);
  if (topChans) embed.addField('Most active channels', topChans, true);
  if (topEmotes) embed.addField('Most used emotes', topEmotes, true);
  
  message.channel.send({embed});
};
