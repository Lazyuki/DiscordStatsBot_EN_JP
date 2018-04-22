module.exports.name = 'user';

module.exports.alias = [
  'user',
  'u'
];
module.exports.isAllowed = (message) => {
  return message.author.id == '284840842026549259';
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
    member = await server.guild.fetchMember(user.id);
    
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
  let topCHannels = {};
  for (let ch in chans) {
    if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
    if (topCHannels[ch]) {
      topCHannels[ch] += chans[ch];
    } else {
      topCHannels[ch] = chans[ch];
    }
  }

  // Sorts the active channels
  let sortable = [];
  for (let c in topCHannels) {
    sortable.push([c, topCHannels[c]]);
  }
  sortable.sort(function(a, b) {
    return b[1] - a[1];
  });
  let topChans = '';
  for (let i = 0; i < 3 && i < sortable.length; i++) {
    let perc = (sortable[i][1] / record.thirty * 100).toFixed(1);
    let channel = server.guild.channels.get(sortable[i][0]);
    if (!channel) continue;
    topChans += '**#' + channel.name + '** : ' + perc + '%\n';
  }

  // Most used emotes
  let topEmotesArr = [];
  let emotes = record.totalReactions();
  console.log(emotes);
  for (let emote in emotes) {
    topEmotesArr.push([emote, emotes[emote]]);
  }
  topEmotesArr.sort(function(a, b) {
    return b[1] - a[1];
  });
  console.log(topEmotesArr);
  let topEmotes = '';
  let nameRegex = /<a?(:[\S]+:)\d+>/;
  for (let i = 0; i < 3 && i < topEmotesArr.length; i++) {
    console.log(i);
    let name = topEmotesArr[i][0];
    let regMatch = name.match(nameRegex);
    if (regMatch) name = regMatch[1];
    topEmotes += `${name} ${topEmotesArr[i][1]} times\n`;
  }

  // Most active day in the last 4 weeks, excluding today.
  let d = new Date().getUTCDay() - 1; // Sunday = 0, do not count today.
  if (d == -1) d = 6;
  let dayArr = [0, 0, 0, 0, 0, 0, 0]; // Su Mo Tu We Th Fr Sa
  let daySum = 0;
  let count = 0;
  let week = 0;
  for (let i = server.today; i >= server.today - 28; i--) { // 4 weeks
    let chans = record.record[((i % 31) + 31) % 31]; // for under flows
    for (let ch in chans) {
      if (ch == 'jpn' || ch == 'eng' || ch == 'vc') continue;
      else if (!/\d+/.test(chans[ch])) delete record.chans[ch];
      if (count < 7) week += chans[ch];
      if (count == 0) continue;
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

  let hours = Math.floor(record.vc / 60); 
  let vcTime = `${hours ? hours + 'hr '  : ''}${record.vc % 60}min`;

  let embed = new Discord.RichEmbed();
  if (user) {
    let fire = member.roles.has('384286851260743680');
    embed.setAuthor(`${fire ? '🔥' : ''}Stats for ${user.tag}${member.nickname ? ' aka ' + member.nickname : ''}` , user.avatarURL);
    embed.color = fire ? Number('0xFF5500') : Number('0x3A8EDB');
    embed.setFooter('Joined this server');
    embed.timestamp = member.joinedAt;
  } else { // user left
    embed.setAuthor(`Stats for <@${content}>`);
    embed.color = Number('0x3A8EDB');
  }
  embed.description = 'For the last 30 days (UTC time)';
  let chanPercent = (maxDayNum / daySum * 100).toFixed(1);
  let jpnPercent = (record.jp / (record.jp + record.en) * 100).toFixed(2);
  embed.addField('Messages sent\n M | W', `${record.thirty} | ${week}`, true);
  embed.addField('Most active channels', topChans ? topChans : 'none', true);
  if (maxDayNum != 0) embed.addField('Most active day', days[maxDay] + `\n(${chanPercent}%)`, true);
  //embed.addField('Reacted', record.reactions, true);
  embed.addField('Japanese usage', jpnPercent + '%', true);
  embed.addField('Time Spent in VC', vcTime , true);
  embed.addField('Most used emotes', topEmotes, true);
  
  message.channel.send({embed});
};
