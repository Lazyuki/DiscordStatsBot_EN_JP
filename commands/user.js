const Discord = require('discord.js');


module.exports.alias = [
	'u',
  'user',
  'usr',
  'whois'
];

module.exports.command = async (message, content, bot) => {
  var user = message.author; // default
  let mentions = message.mentions.members;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey());
  } else if (content != '') {
    if (bot.server.users[content]) { // TODO: check with name instead of ID
      user = bot.guilds.get('189571157446492161').members.get(content); // not good if banned
    } else {
      // User not found
    }
  }
  var record = bot.server.users[user.id];
  var chans = record.channels;

  // Most active channel
  var max = 0;
  var maxID = '';
  for (var chid in chans) {
    if (chans[chid] > max) {
      max = chans[chid];
      maxID = chid;
    }
  }

  // Most active day in the last 4 weeks, excluding today.
  var d = new Date().getUTCDay() - 1; // Sunday = 0, do not count today.
  let dayArr = [0, 0, 0, 0, 0, 0, 0]; // Su Mo Tu We Th Fr Sa
  for (var i = bot.server.today - 1; i > bot.server.today - 28; i--) { // 4 weeks
    var chans = record.record[((i % 31) + 31) % 31];
    for (var ch in chans) {
      dayArr[d] += chans[ch];
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
  embed.title = `Stats for ${user.displayName}`;
  embed.description = 'For the last 30 days (UTC time)'
  embed.color = Number('0x3A8EDB');

  let IDpercent = (max / record.thirtyDays * 100).toFixed(2);
  embed.addField('Messages sent', record.thirtyDays, true);
  embed.addField('Most active channel',
    '#' + bot.guilds.get('189571157446492161').channels.get(maxID).name + `\n(${IDpercent}%)`, true); // fix for undefined
  embed.addField('Most active day', days[maxDay], true);
  //embed.addField('Last message sent', , true);
  //embed.addField('Messages today, this week, this month', , true);
  message.channel.send({embed});
};
