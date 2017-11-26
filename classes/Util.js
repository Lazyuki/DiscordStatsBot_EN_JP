// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
const jpregex = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
const enregex = /[a-vx-zA-VX-Z]|[ａ-ｖｘ-ｚＡ-ＶＸ-Ｚ]/;
const urlregex = /https?:\/\/(www\.)?\S{2,256}\.[a-z]{2,6}\S*/g;
const reactregex = /<:[\w-]+:\d+>/g
const userregex = /<@\d+>/g
const channelregex = /<#\d+>/g
const roleregex = /<@&\d+>/g
const idregex = /<([@#]|@&|:[\w-]+:)\d+>/g

module.exports = class Util {

  static searchUser(message, content, server) {
    let mentions = message.mentions.users;
    let user = null;
    if (mentions.size != 0) {
      user = mentions.first();
    } else if (content != '') { // search name
      content = content.toLowerCase();
      for (var id in server.users) {
        if (id == content) {
          user = server.guild.members.get(id).user;
          break;
        }
        let u = server.guild.members.get(id);
        if (u == undefined) continue; // if banned or left
        if (u.user.username.toLowerCase().startsWith(content)
            || u.displayName.toLowerCase().startsWith(content)) {
          user = u.user;
          break;
        }
      }
      if (!user) { // Search failed
  			message.react('❓');
        return null;
      }
    }
    return user;
  }

// returns true if japanese, false if english, null if inconclusive (or it has *)
  static isJapanese(message) {
    let jpCount = 0;
    let enCount = 0;
    let other = 0
    let content = message.content.replace(urlregex, '');
    content = content.replace(idregex, '');
    for (var l of content) {
      if (l == '*' || l == '＊') {
        return null;
      }
      if (jpregex.test(l)) {
        jpCount++;
      } else if (enregex.test(l)) {
        enCount++;
      } else if (l != ' '){
        other++;
      }
    }
    if (jpCount < 3 && enCount < 3 && other > 0) return null; // it's probably a face
    return jpCount == enCount ? null : jpCount * 1.7 > enCount
  }
}
