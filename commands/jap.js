module.exports.name = 'jap';
module.exports.alias = ['jap'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,jap` explains why `jap` is a racial slur';

const Discord = require('discord.js');

module.exports.command = async (message) => {
  const embed = new Discord.MessageEmbed();
  embed.description =
    'We avoid "jap" on this server due to its historical use as a racial slur. We prefer "jp", "jpn", or "Japanese". Thanks for understanding.\n' +
    '([Some picture examples](https://imgur.com/a/lPVBo2y))\n' +
    '([Read more here](https://gist.github.com/ScoreUnder/e08b37a8af3c257107fc55fc7a8fcad6))';
  embed.color = Number('0xFF5500');
  message.channel.send({ embed });
  message.delete();
};
