module.exports.name = 'userDetails';
module.exports.alias = ['user-channels', 'uch'];
module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');
const Util = require('../classes/Util.js');

module.exports.help = 'List channels for the user `,uch [name, @mention]`';

module.exports.command = async (message, content, bot, server) => {
  let user =
    content == ''
      ? message.author
      : await Util.searchUser(message, content, server, bot);
  if (!user) {
    message.react('❓');
    return;
  }

  var record = server.users[user.id];
  let member = await server.guild.member(user);

  // the user hasn't sent anything in the past 30 days
  if (record == undefined) {
    let embed = new Discord.RichEmbed();
    embed.title = `Stats for ${user.username}`;
    embed.description = "Hasn't said anything in the past 30 days";
    embed.color = Number('0x3A8EDB');
    if (member) {
      // ban check
      embed.setFooter('Joined ');
      embed.timestamp = member.joinedAt;
    }
    message.channel.send({ embed });
    return;
  }

  var chans = record.chans;
  let ignoreHidden = !server.hiddenChannels.includes(message.channel.id);

  // Most active channels
  var topCHannels = {};
  for (var ch in chans) {
    if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
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
  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });
  var topChans = `User channels for ${user.username}\n`;
  for (var i = 0; i < sortable.length; i++) {
    let perc = sortable[i][1];
    let channel = server.guild.channels.get(sortable[i][0]);
    if (!channel) continue;
    topChans += '**#' + channel.name + '** : ' + perc + ' messages\n';
  }

  message.channel.send(topChans);
};
