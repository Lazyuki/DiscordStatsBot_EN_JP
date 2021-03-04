module.exports.name = 'fj';
module.exports.alias = ['fj'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,fj` explanation of fj';

const Discord = require('discord.js');
module.exports.command = async (message) => {
  const embed = new Discord.MessageEmbed();
  embed.description =
    '深緑(日本語が流暢)のタグを得るためには、まずは管理者かWelcoming Partyの日本人が、あなたのテキストを読んで流暢だと認める必要があります。FJタグご希望の方は、ボイスチャット上でも日本語が流暢であることを確認させてもらいます。\n' +
    "If you don't understand this, you aren't ready yet.";
  embed.color = Number('0x279b4a');
  message.channel.send({ embed });
  message.delete();
};
