module.exports.name = 'checkHardCore';
module.exports.actions = ['NEW', 'EDIT'];

module.exports.isAllowed = (message, server) => {
  if (!message.member.roles.has('384286851260743680')) return false; // Hardcore role
  // disabled in #japanese_questions, #english_questions, #correct_me, #language_exchange
  if (['189601264424714241', '193959229030268938', '314193922761031680', '376574779316109313'].includes(message.channel.id)) return false;
  if (server.hiddenChannels.includes(message.channel.id)) return false; // Not in mod room
  return true;
};

const Util = require('../classes/Util.js');
const Discord = require('discord.js');

module.exports.process = (message) => {
  let content = message.content;
  let isJapanese = message.member.roles.has('196765998706196480'); // has native japanese  
  if (message.channel.id == '225828894765350913' && /^(k!|t!|[!.&%=+$])[^\n]*/.test(content)) return; // #bot
  if (/^\.\.\.\s[\S]+$/.test(content)) return; // nadeko quote
  if (isJapanese)
    content = content.replace(/[*＊]([\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]){1,6}/,''); // only the first match
  else {
    content = content.replace(/[*＊](\w{1,12}\s){1,3}/, ''); // only the first match of correction
    content = content.replace(/what'?s?\s(is\s)?(yo)?ur\snative\slang(uage)?/i, '');
    content = content.replace(/welcome/i, '');
  }
  let lang = Util.lang(content); // Since it deletes special messages.
  if (isJapanese && (lang & Util.LANG.JPN)) { // Japanese
    if (content.length > 80) {
      let embed = new Discord.RichEmbed();
      embed.description = content;
      embed.setFooter(`#${message.channel.name}`);
      embed.color = Number('0xDB3C3C');
      message.author.send('どうやら長いメッセージを消してしまったみたいです。重要だといけないので一応送っておきます。', {embed});      
    }
    message.delete(500);
    return;
  }
  if (!isJapanese && (lang & Util.LANG.ENG)) { // English
    if (content.length > 120) {
      let embed = new Discord.RichEmbed();
      embed.description = content;
      embed.setFooter(`#${message.channel.name}`);
      embed.color = Number('0xDB3C3C');
      message.author.send('It seems like I deleted your long message that might be important.', {embed});      
    }
    message.delete(500);
    return;
  }
};