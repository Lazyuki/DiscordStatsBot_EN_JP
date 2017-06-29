const Discord = require('discord.js');


module.exports.alias = [
	'u',
  'user',
  'usr',
  'whois',
  'info'
];

module.exports.command = async (message, content, bot) => {
  var user = message.author; // default
  let mentions = message.mentions.members;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') { // search name
    content = content.toLowerCase();
    for (var id in bot.server.users) {
      let u = bot.server.server.members.get(id);
      if (u == undefined) continue; // if banned
      if (u.user.username.toLowerCase().startsWith(content)
          || u.displayName.toLowerCase().startsWith(content)) {
        user = u.user;
        break;
      }
    }
  }
  var record = bot.server.users[user.id];
  var chans = record.channels;
  let ignoreHidden = !bot.server.hiddendChannels.includes(message.channel.id);

  // Most active channel
  var chanMax = 0;
  var chanMaxID = '';
  for (var chid in chans) {
    if (bot.server.hiddenChannels.includes(chid) && ignoreHidden) continue;
    if (chans[chid] > chanMax) {
      chanMax = chans[chid];
      chanMaxID = chid;
    }
  }

  // Most active day in the last 4 weeks, excluding today.
  var d = new Date().getUTCDay() - 1; // Sunday = 0, do not count today.
  let dayArr = [0, 0, 0, 0, 0, 0, 0]; // Su Mo Tu We Th Fr Sa
  var daySum = 0;
  for (var i = bot.server.today - 1; i > bot.server.today - 28; i--) { // 4 weeks
    var chans = record.record[((i % 31) + 31) % 31];
    for (var ch in chans) {
      dayArr[d] += chans[ch];
      daySum += chans[ch];
    }
    d = ((d - 1) % 7 + 7) % 7;
  }
  var maxDayNum = 0;
  var maxDay = 0;
  for (var j = 0; j < 7; j++) {
    if (dayArr[j] > maxDayNum) {
      maxDayNum = dayArr[j];
      maxDay = j;
    }
  }

  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
              'Thursday', 'Friday', 'Saturday'];

  let embed = new Discord.RichEmbed();
  embed.title = `Stats for ${user.username}`;
  embed.description = 'For the last 30 days (UTC time)'
  embed.color = Number('0x3A8EDB');

  let IDpercent = (chanMax / record.thirtyDays * 100).toFixed(2);
  let chanPercent = (maxDayNum / daySum * 100).toFixed(2);
  embed.addField('Messages sent ', record.thirtyDays, true);
  embed.addField('Most active channel',
    '#' + bot.server.server.channels.get(chanMaxID).name + `\n(${IDpercent}%)`, true); // fix for undefined
  if (maxDayNum != 0) embed.addField('Most active day', days[maxDay] + `\n(${chanPercent}%)`, true);
  //embed.addField('Last message sent', , true);
  //embed.addField('Messages today, this week, this month', , true);
  embed.setFooter('Current UTC time: ' + new Date().toUTCString());
  message.channel.send({embed});
};
