const Discord = require('discord.js');
const Util = require('../classes/Util.js');
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
						'Thursday', 'Friday', 'Saturday'];

module.exports.alias = [
	'u',
  'user',
  'usr',
  'whois',
  'info',
  'dare'
];

module.exports.command = async (message, content, bot, server) => {

  let user = content == '' ? message.author : Util.searchUser(message, content, server);
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
		// the user hasn't sent anything in the past 30 days
		if (record == undefined) {
			let embed = new Discord.RichEmbed();
			embed.title = `Stats for ${user.tag}`;
			embed.description = 'Hasn\'t said anything in the past 30 days'
			embed.color = Number('0x3A8EDB');
			if (member) { // ban check
				embed.setFooter('Joined ');
				embed.timestamp = member.joinedAt;
			}
			message.channel.send({embed});
			return;
		}
	}

  var chans = record.chans;
  let ignoreHidden = !~server.hiddenChannels.indexOf(message.channel.id);

  // Most active channels
  var topCHannels = {};
	for (var ch in chans) {
    if (~server.hiddenChannels.indexOf(ch) && ignoreHidden) continue;
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
    let perc = (sortable[i][1] / record.thirty * 100).toFixed(1);
		let channel = server.guild.channels.get(sortable[i][0]);
		if (!channel) continue;
	  topChans += "**#" + channel.name + "** : " + perc + "%\n";
	}

  // Most active day in the last 4 weeks, excluding today.
  var d = new Date().getUTCDay() - 1; // Sunday = 0, do not count today.
  if (d == -1) d = 6;
  let dayArr = [0, 0, 0, 0, 0, 0, 0]; // Su Mo Tu We Th Fr Sa
  var daySum = 0;
  for (var i = server.today - 1; i > server.today - 28; i--) { // 4 weeks
    var chans = record.record[((i % 31) + 31) % 31]; // in case it over flows
    for (var ch in chans) {
			if (ch == 'jpn') continue;
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

	if (!user) {
		let embed = new Discord.RichEmbed();
    embed.setAuthor(`Stats for <@${content}>`);
		embed.description = 'For the last 30 days (UTC time)'
		embed.color = Number('0x3A8EDB');
		let chanPercent = (maxDayNum / daySum * 100).toFixed(1);
		let jpnPercent = (record.jp / record.thirty * 100).toFixed(2);
		embed.addField('Messages sent ', record.thirty, true);
		embed.addField('Most active channels', topChans, true);
		if (maxDayNum != 0) embed.addField('Most active day', days[maxDay] + `\n(${chanPercent}%)`, true);
		//embed.addField('Emojis used', , true);
		//embed.addField('Time Spent in VC', , true);
		//embed.addField('Reacted', record.reactions, true);
		embed.addField('Japanese usage', jpnPercent + '%', true);
		message.channel.send({embed});
		return;
	}
	let fire = member.roles.has('384286851260743680');
  let embed = new Discord.RichEmbed();
	embed.setAuthor(`${fire ? '🔥' : ''}Stats for ${user.tag}${member.nickname ? ' aka ' + member.nickname : ''}` , user.avatarURL);
  embed.description = 'For the last 30 days (UTC time)'
  embed.color = fire ? Number('0xFF5500') : Number('0x3A8EDB');
  let chanPercent = (maxDayNum / daySum * 100).toFixed(1);
  let jpnPercent = (record.jp / record.thirty * 100).toFixed(2);
  embed.addField('Messages sent ', record.thirty, true);
  embed.addField('Most active channels', topChans, true);
  if (maxDayNum != 0) embed.addField('Most active day', days[maxDay] + `\n(${chanPercent}%)`, true);
  //embed.addField('Emojis used', , true);
	//embed.addField('Time Spent in VC', , true);
	//embed.addField('Reacted', record.reactions, true);
  embed.addField('Japanese usage', jpnPercent + '%', true);
	if (member) { // ban check
		embed.setFooter('Joined this server');
		embed.timestamp = member.joinedAt;
	}
  message.channel.send({embed});
};
