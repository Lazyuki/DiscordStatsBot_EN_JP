const Discord = require('discord.js');

module.exports.alias = [
	'u',
  'user',
  'usr',
  'whois',
  'info',
  'dare'
];

module.exports.command = async (message, content, bot) => {
  var user = message.author; // default
  let mentions = message.mentions.members;
  if (mentions.size != 0) {
    user = mentions.get(mentions.firstKey()).user;
  } else if (content != '') { // search name
    content = content.toLowerCase();
    for (var id in bot.server.users) {
      let u = bot.server.guild.members.get(id);
      if (u == undefined) continue; // if banned or left
      if (u.user.username.toLowerCase().startsWith(content)
          || u.displayName.toLowerCase().startsWith(content)) {
        user = u.user;
        break;
      }
    }
    if (user.id == message.author.id) { // Search failed
			// react with X
      return;
    }
  }

  var record = bot.server.users[user.id];
	let member = await bot.server.guild.fetchMember(user);

	// the user hasn't sent anything in the past 30 days
	if (record == undefined) {
		let embed = new Discord.RichEmbed();
		embed.title = `Stats for ${user.username}`;
		embed.description = 'Hasn\'t said anything in the past 30 days'
		embed.color = Number('0x3A8EDB');
		return;
	}

  var chans = record.channels;
  let ignoreHidden = !bot.server.hiddenChannels.includes(message.channel.id);

  // Most active channels
  var topCHannels = {};
	for (var ch in chans) {
      if (bot.server.hiddenChannels.includes(ch) && ignoreHidden) continue;
		if (topCHannels[ch]) {
			topCHannels[ch] += chans[ch];
		} else {
			topCHannels[ch] = chans[ch];
		}
	}

	// Sorts the active channels
  var sortable = [];
	for (var c in topCHannels) {
	  sortable.push([c, topCHannels[c]]);
	}
	sortable.sort(function(a, b) {
	    return b[1] - a[1];
	});
  var topChans = '';
  for (var i = 0; i < 3 && i < sortable.length; i++) {
    let perc = (sortable[i][1] / record.thirtyDays * 100).toFixed(1);
	  topChans += "**#" + bot.server.guild.channels.get(sortable[i][0]).name + "** : " + perc + "%\n";
	}

  // Most active day in the last 4 weeks, excluding today.
  var d = new Date().getUTCDay() - 1; // Sunday = 0, do not count today.
  if (d == -1) d = 6;
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

  let chanPercent = (maxDayNum / daySum * 100).toFixed(1);
  let jpnPercent = (record.japanese / record.thirtyDays * 100).toFixed(2);
  embed.addField('Messages sent ', record.thirtyDays, true);
  embed.addField('Most active channels', topChans, true);
  if (maxDayNum != 0) embed.addField('Most active day', days[maxDay] + `\n(${chanPercent}%)`, true);
  //embed.addField('Favorite emoji', , true);
  //embed.addField('Messages today, this week, this month', , true);
  embed.addField('Japanese usage', jpnPercent + '%', true);
  message.channel.send({embed});
};
