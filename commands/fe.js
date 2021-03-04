module.exports.name = 'fe';
module.exports.alias = ['fe'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,fe` explanation of fe';

const Discord = require('discord.js');
module.exports.command = async (message) => {
  const embed = new Discord.MessageEmbed();
  embed.description =
    "People with the 'Fluent' tag must set a good example for English learners. If we see you speak accurately and actively in English, you will receive the tag (may take a while).";
  embed.color = Number('0x3995ff');
  message.channel.send({ embed });
  message.delete();
};
