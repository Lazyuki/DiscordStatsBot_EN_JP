module.exports.name = 'checkHardCore';
module.exports.events = ['NEW', 'EDIT'];

module.exports.isAllowed = (message, server) => {
  // DONT MESS WITH THE CODE HERE!!!!!!!!
  if (!message.member) {
    console.log(`chkHrdCr: ${message.content} in #${message.channel.name}`);
    return false;
  }
  if (!message.member.roles.has('384286851260743680') && !message.member.roles.has('436573300810973185')) return false; // Hardcore role
  // disabled in #japanese_questions, #english_questions, #correct_me, #language_exchange, #nihongo-study, #eigo-no-beenkyo
  if (['189601264424714241', '193959229030268938', '314193922761031680', '376574779316109313'].includes(message.channel.id)) return false;
  if (server.hiddenChannels.includes(message.channel.id)) return false; // Not in mod room
  return true;
};

const Util = require('../classes/Util.js');
const Discord = require('discord.js');

module.exports.process = (message) => {
  let content = message.content;
  let isJapanese = message.member.roles.has('196765998706196480') || message.member.roles.has('292401145752846337'); // has native japanese  
  if (message.channel.id == '225828894765350913' && /^(k!|t!|[!.&%=+$])/.test(content)) return; // #bot
  if (['343151415595892739', '343057592467062795', '304758913914503168', '344541594755792896'].includes(message.channel.id) && /^(k!|t!|kq!|m!|[!<.])/.test(content)) return; // #bot-spam

  if (/^\.\.\.\s[\S]+$/.test(content)) return; // nadeko quote
  // if (!isJapanese) { // for welcoming
  //   content = content.replace(/what'?s?\s(is\s)?(yo)?ur\snative\slang(uage)?/i, '');
  //   content = content.replace(/welcome/i, '');
  // }
  content = content.replace(/```\S*\n[\s\S]*?```/g, ''); // ignore code block

  let lang = Util.lang(content); // Since it deletes special messages.
  if (lang & Util.LANG.ESC) return;
  if (isJapanese && (lang & Util.LANG.JPN)) { // Japanese
    if (content.length > 80) {
      let embed = new Discord.MessageEmbed();
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
      let embed = new Discord.MessageEmbed();
      embed.description = content;
      embed.setFooter(`#${message.channel.name}`);
      embed.color = Number('0xDB3C3C');
      message.author.send('It seems like I deleted your long message that might be important.', {embed});      
    }
    message.delete(500);
    return;
  }
};