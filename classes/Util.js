
  // 3040-309F : hiragana
  // 30A0-30FF : katakana
  // FF66-FF9D : half-width katakana
  // 4E00-9FAF : common and uncommon kanji
//exports.REGEX_JPN = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
//exports.REGEX_ENG = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
//exports.REGEX_URL = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;
/*exports.REGEX_REACT = /<:[\S]+:\d+>/g;
exports.REGEX_USER = /<@!?\d+>/g;
exports.REGEX_CHAN = /<#\d+>/g;
exports.REGEX_ROLE = /<@&\d+>/g;
exports.REGEX_ID = /(<@!?|#|@&|:[\S]+:)\d+>/g;

exports.searchUser = function(message, content, server) {
  let mentions = message.mentions.users;
  content = content.trim();
  let user = null;
  if (mentions.size != 0) {
    return mentions.first();
  } else if (content != '') { // search name
    let regex = content[0] == '*';
    if (regex) {
      let r = new RegExp(content.substr(1, content.length), 'i');
      for (var id in server.users) {
        let u = server.guild.members.get(id); // TODO change to fetch?
        if (u == undefined) continue; // if left
        if (r.test(u.user.tag) || r.test(u.nickname)) {
          return u.user;
        }
      }
    } else {
      content = content.toLowerCase();
      for (var id in server.users) {
        if (id == content) { // ID search
          server.guild.fetchMember(id).then((member) => {
            return member ? member.user : null;
          });
        }
        let u = server.guild.members.get(id); // TODO change to fetch?
        if (u == undefined) continue; // if left
        if (u.user.tag.toLowerCase().startsWith(content) || (u.nickname && u.nickname.toLowerCase().startsWith(content))) {
          return u.user;
        }
      }
    }
  }
  return null;
}

exports.LANG = Object.freeze({
  ENG : 0,
  JPN : 1,
  OTH : 2,
  ESC : 3
});
// returns true if japanese, false if english, null if inconclusive (or it has *)
// Returns 1 if Japanese, -1 if English, 0 otherwise.
exports.lang = function(content, escapeStar=true) {
  let jpCount = 0;
  let enCount = 0;
  let other = 0
  content = content.replace(exports.REGEX_URL, '');
  content = content.replace(exports.REGEX_ID, '');
  content = content.replace(/o.o/i, '');
  for (var l of content) {
    if (l == '*' || l == '＊') {
      if (escapeStar) return exports.LANG.ESC;
    }
    if (exports.REGEX_JPN.test(l)) {
      jpCount++;
    } else if (exports.REGEX_ENG.test(l)) {
      enCount++;
    } else if (!/[\sw]/i.test(l)){
      other++;
    }
  }
  if (jpCount == enCount) return exports.LANG.OTH;
  if (jpCount < 3 && enCount < 3 && other > 0) return exports.LANG.OTH; // it's probably a face
  return  jpCount * 1.7 > enCount ? exports.LANG.JPN : exports.LANG.ENG;
}
*/
module.exports = class Util {
  static get REGEX_JPN() { return /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/ }
  static get REGEX_ENG() { return /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/ }
  static get REGEX_URL() { return /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g }
  static get REGEX_REACT() { return /<:[\S]+:\d+>/g }
  static get REGEX_USER() { return /<@!?\d+>/g }
  static get REGEX_CHAN() { return /<#\d+>/g }
  static get REGEX_ROLE() { return /<@&\d+>/g }
  static get REGEX_ID() { return /(<@!?|#|@&|:[\S]+:)\d+>/g }

  static searchUser (message, content, server) {
    let mentions = message.mentions.users;
    content = content.trim();
    let user = null;
    if (mentions.size != 0) {
      return mentions.first();
    } else if (content != '') { // search name
      if (content[0] == '*') { // regex
        let r = new RegExp(content.substr(1, content.length), 'i');
        for (var id in server.users) {
          let u = server.guild.members.get(id); // TODO change to fetch?
          if (u == undefined) continue; // if left
          if (r.test(u.user.tag) || r.test(u.nickname)) {
            return u.user;
          }
        }
      } else {
        content = content.toLowerCase();
        for (var id in server.users) {
          if (id == content) { // ID search
            let member = server.guild.members.get(id)
            return member ? member.user : null;
          }
          let u = server.guild.members.get(id); // TODO change to fetch?
          if (u == undefined) continue; // if left
          if (u.user.tag.toLowerCase().startsWith(content) || u.displayName.toLowerCase().startsWith(content)) {
            return u.user;
          }
        }
      }
    }
    return null;
  }

  static get LANG(){return Object.freeze({
    ENG : 0,
    JPN : 1,
    OTH : 2,
    ESC : 3
  })}
  // returns true if japanese, false if english, null if inconclusive (or it has *)
  // Returns 1 if Japanese, -1 if English, 0 otherwise.
  static lang(content, escapeStar=true) {
    let jpCount = 0;
    let enCount = 0;
    let other = 0
    content = content.replace(Util.REGEX_URL, '');
    content = content.replace(Util.REGEX_ID, '');
    content = content.replace(/o.o/i, '');
    for (var l of content) {
      if (l == '*' || l == '＊') {
        if (escapeStar) return Util.LANG.ESC;
      }
      if (Util.REGEX_JPN.test(l)) {
        jpCount++;
      } else if (Util.REGEX_ENG.test(l)) {
        enCount++;
      } else if (!/[\sw]/i.test(l)){
        other++;
      }
    }
    if (jpCount == enCount) return Util.LANG.OTH;
    if (jpCount < 3 && enCount < 3 && other > 0) return Util.LANG.OTH; // it's probably a face
    return  jpCount * 1.7 > enCount ? Util.LANG.JPN : Util.LANG.ENG;
  }
}
