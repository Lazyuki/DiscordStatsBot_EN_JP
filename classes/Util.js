const Discord = require('discord.js');
// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
exports.REGEX_JPN = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
exports.REGEX_ENG = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
exports.REGEX_URL = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;
exports.REGEX_REACT = /<a?:[\S]+:\d+>/g;
exports.REGEX_USER = /<@!?\d+>/g;
exports.REGEX_CHAN = /<#\d+>/g;
exports.REGEX_ROLE = /<@&\d+>/g;
exports.REGEX_ID = /<(@!?|#|@&|a?:[\S]+:)\d+>/g;

exports.searchUser = function(message, content, server, bot) {
  let mentions = message.mentions.users;
  content = content.trim();
  if (mentions.size != 0) {
    return mentions.first();
  } else if (content != '') { // search name
    let regex = content[0] == '*';
    if (regex) {
      let r = new RegExp(content.substr(1, content.length), 'i');
      for (let id in server.users) {
        let u = server.guild.members.get(id); // TODO change to fetch?
        if (u == undefined) continue; // if left
        if (r.test(u.user.tag) || r.test(u.nickname)) {
          return u.user;
        }
      }
    } else {
      content = content.toLowerCase();
      for (let id in server.users) {
        let u = server.guild.members.get(id);
        if (id == content) {
          return bot.fetchUser(id); // This returns a Promise
        }
        if (u == undefined) continue; // user left
        if (u.user.tag.toLowerCase().startsWith(content) || (u.nickname && u.nickname.toLowerCase().startsWith(content))) {
          return u.user;
        }
      }
    }
  }
  return null;
};

exports.LANG = Object.freeze({
  ENG : 1,
  JPN : 1 << 1,
  OTH : 1 << 2,
  ESC : 1 << 3
});

exports.lang = function(content) {
  let jpCount = 0;
  let enCount = 0;
  let other = 0;
  let result = 0;
  content = content.replace(exports.REGEX_URL, '');
  content = content.replace(exports.REGEX_ID, '');
  content = content.replace(/o.o/i, '');
  for (let l of content) {
    if (l == '*' || l == '＊') {
      result |= exports.LANG.ESC;
    }
    if (exports.REGEX_JPN.test(l)) {
      jpCount++;
    } else if (exports.REGEX_ENG.test(l)) {
      enCount++;
    } else if (!/[\sw]/i.test(l)){
      other++;
    }
  }
  if (jpCount == enCount) {
    return result | exports.LANG.OTH;
  }
  if (jpCount < 3 && enCount < 3 && other > 0) return result | exports.LANG.OTH; // it's probably a face
  return  jpCount * 1.7 > enCount ? result | exports.LANG.JPN : result | exports.LANG.ENG;
};

exports.postLogs = function(msg, server) {
  let embed = new Discord.RichEmbed();
  let date = new Date(msg.time);
  embed.setAuthor(`${msg.atag} ID: ${msg.aid}` ,msg.apfp);
  if (msg.del) { // message was deleted
    embed.title = `Message Deleted after ${msg.dur} seconds`;
    embed.description = msg.con;
    embed.color = Number('0xDB3C3C');
  } else { // message was edited
    embed.title = `Message Edited after ${msg.dur} seconds`;
    embed.addField('Before:', `${msg.con}`, false);
    embed.addField('After:', `${msg.acon}`, false);
    embed.color = Number('0xff9933');
  }
  embed.setFooter(`#${msg.ch}`);
  embed.timestamp = date;
  if (msg.img != '') { // if != null
    embed.addField('imgur link', msg.img, false);
    embed.setThumbnail(msg.img);
  }
  let chan = server.guild.channels.get('366692441442615306'); // #mod_log
  if (chan == undefined) return;
  chan.send({embed});
};
