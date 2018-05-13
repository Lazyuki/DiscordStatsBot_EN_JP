module.exports.name = 'userJoin';
module.exports.events = ['JOIN'];

module.exports.initialize = (json, server) => {
  server.newUsers = [];
  if (!json || !json['newUsers']) return;
  server.newUsers = json['newUsers'];
};
module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');

module.exports.process = async (member, server) => {
  if (server.newUsers.unshift(member.id) > 3) server.newUsers.pop();
  if (member.guild.id == '189571157446492161') {
    if (member.guild.members.get('270366726737231884').presence.status == 'offline') { // tatsu
      let embed = new Discord.RichEmbed();
      embed.description = `📥**${member.user.tag}** has \`joined\` the server. (${member.id})`;
      embed.setFooter(`User Join (${member.guild.memberCount})`, member.user.avatarURL);
      embed.setTimestamp();
      embed.setColor(0x84a332);
      member.guild.channels.get('277384105245802497').send({embed});
    }
    if (member.guild.members.get('159985870458322944').presence.status == 'offline') { // mee6
      let welcome = `Welcome ${member} to the English-Japanese Language Exchange. Please read the rules first If you have any questions feel free to message one of the Mods!  Tell us what your native language is and we'll get you properly tagged with a colored name.\n\n`;
      welcome += `${member}さん、ようこそEnglish-Japanese Language Exchangeへ!\nあなたの母語を教えてください!\n質問があれば、何でも遠慮なく聞いてくださいね。このチャンネルには日本語と英語で投稿できます。よろしくお願いします！ <@&357449148405907456>`;
      member.guild.channels.get('189571157446492161').send(welcome);
    }
  }
};
