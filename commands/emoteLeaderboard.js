const Discord = require('discord.js');
const BST = require('../classes/BST.js');
const Util = require('../classes/Util.js');

module.exports.name = 'emoteLeaderboard';

module.exports.alias = [
  'emotes',
  'emojis',  
  'emlb'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,emlb [-s]` Emote leaderboard for this server. Put `-s` to show only the server emotes.';

module.exports.command = async (message, content, bot, server) => {
  let channel = message.channel;
  let onlyServer = /-l?s/.test(content) ? server.guild.emojis.map((v) => {return v.toString();}) : null;
  let longList = /-s?l/g.test(content);
  content = content.replace(/-[sl]+/g, '').trim();
  
  let users = server.users;
  let emDict = {};
  for (let user in users) {
    let reactions = users[user].totalReactions();
    if (reactions) {
      for (let r in reactions) {
        if (onlyServer && !onlyServer.includes(r)) continue;
        if (!emDict[r]) emDict[r] = 0;
        emDict[r] +=  reactions[r];
      }
    }
  }
  let result = new BST();
  for (let e in emDict) result.add(e, emDict[e]);
  result = result.toMap();
  let count = 1;
  let found = false;	
  if (!result[content]) found = true; // If no such emote exists. 

  if (longList) {
    let list = '';
    let nameRegex = /<a?(:[\S]+:)\d+>/;
    for (let emote in result) {
      let regMatch = emote.match(nameRegex);
      if (regMatch && !bot.usableEmotes.includes(emote)) emote = regMatch[1];
      let temp = count++ + ') ' + emote + ' : ' + result[emote] + '\n';
      if (list.length + temp.length < 2000) list += temp;
      else {
        channel.send(list);
        return;
      }
    }
    channel.send(list);
  } else {
    let embed = new Discord.RichEmbed();
    embed.title = `Emote Leaderboard${onlyServer ? ' for server emotes' : ''}`;
    embed.description = 'For the last 30 days (UTC time)';
    embed.color = Number('0x3A8EDB');
    for (let emote in result) {
      if (count >= 25) { // the 25th person is either the 25th one or the user
        if (!found && emote != content) {
          count++;
          continue;
        }
        embed.addField(count + ') ' + emote, result[emote], true);
        break;
      }
      if (emote == content) found = true;
      embed.addField(count++ + ') ' + emote, result[emote], true);
    }
    embed.setFooter('Current UTC time: ' + new Date().toUTCString());
    channel.send({embed});
  }
};
