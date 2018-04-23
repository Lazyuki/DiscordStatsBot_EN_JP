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
  let onlyServer = /-s/.test(content) ? server.guild.emojis.map((v) => {return v.toString();}) : null;
  content = content.replace(/-s/, '').trim();

  let users = server.users;
  let result = new BST();
  for (let user in users) {
    let reactions = users[user].totalReactions();
    if (reactions) {
      for (let r in reactions) {
        if (onlyServer && !onlyServer.includes(r)) continue;
        result.add(r, reactions[r]);
      }
    }
  }
  result = result.toMap();
  let embed = new Discord.RichEmbed();
  embed.title = 'Emote Leaderboard';
  embed.description = 'For the last 30 days (UTC time)';
  embed.color = Number('0x3A8EDB');
  let count = 1;
  let found = false;	
  if (!result[content]) found = true; // If no such emote exists. 
  
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
};
