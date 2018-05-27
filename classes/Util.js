const Discord = require('discord.js');
// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
exports.REGEX_JPN = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
exports.REGEX_ENG = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
exports.REGEX_URL = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;

exports.REGEX_CUSTOM_EMOTES = /(<a?:[\S]+:\d+>)/g;
exports.REGEX_EMOJIS = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
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
  let chan = server.guild.channels.get(server.modLog); // #mod_log
  if (!chan) return;
  chan.send({embed});
};

exports.paginate = async function(msg, embed, list, authorID, searchRank, bot) {
  await msg.react('◀');
  await msg.react('▶');
  await msg.react('🔻');
  msg.react('⏮');
  let authorPage = Math.floor((searchRank - 1) / 25);
  if (!searchRank) authorPage = 0;
  let maxPageNum = Math.floor(list.length / 25);
  let pageNum = 0;
  async function reload() {
    for (let i = 0; i < 25; i++) {
      let rank = i + pageNum * 25;
      if (list[rank]) {
        let [key, val, username] = list[rank];
        if (!username) {
          let user = await bot.fetchUser(key);
          if (!user) continue;
          username = user.username;
          list[rank][2] = username;
        }
        embed.fields[i] = {name: `${rank + 1}) ${username}`, value: val, inline:true };
      } else {
        embed.fields.length = i;
        break;
      }
    }
    msg.edit({embed});
  }
  const filter = (reaction, user) => /[◀▶🔻⏮]/.test(reaction.emoji.name) && user.id === authorID;
  const collector = msg.createReactionCollector(filter, { time: 3 * 60 * 1000 });
  collector.client.on('messageReactionRemove', collector.listener);
  collector.on('collect', r => {
    switch(r.emoji.name) {
    case '▶':
      if (pageNum < maxPageNum) {
        pageNum++;
        reload();
      }
      break;
    case '◀':
      if (pageNum > 0) {
        pageNum--;
        reload();
      }
      break;
    case '🔻':
      if (pageNum != authorPage) {
        pageNum = authorPage;
        reload();
      }
      break;
    case '⏮':
      if (pageNum != 0) {
        pageNum = 0;
        reload();
      }
      break;
    }
  });
  collector.on('end', () => {
    msg.clearReactions();
    collector.client.removeListener('messageReactionRemove', collector.listener);
  });
};