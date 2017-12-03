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
    content = content.trim();
    let user = null;
    if (mentions.size != 0) {
      return mentions.first();
    } else if (content != '') { // search name
      content = content.toLowerCase();
      for (var id in server.users) {
        if (id == content) { // ID search
          server.guild.fetchMember(id).then((member) => {
            return member ? member.user : null;
          });
        }
        let u = server.guild.members.get(id); // TODO change to fetch?
        if (u == undefined) continue; // if left
        if (content[0] == '*') {
          content = content.substr(1, content.length);
        } else {
          content = '^' + content;
        }
        let r = new RegExp(content);
        if (content.test(u.user.tag.toLowerCase()) || content.test(u.displayName.toLowerCase())) {
          return u.user;
        }
      }
      if (!user) { // Search failed
        return null;
      }
    }
    return null;
  }

// returns true if japanese, false if english, null if inconclusive (or it has *)
// Returns 1 if Japanese, -1 if English, 0 otherwise.
  static isJapanese(content, escapeStar=true) {
    let jpCount = 0;
    let enCount = 0;
    let other = 0
    content = content.replace(urlregex, '');
    content = content.replace(idregex, '');
    content = content.replace(/o.o/i, '');
    for (var l of content) {
      if (l == '*' || l == '＊') {
        if (escapeStar) return 0;
      }
      if (jpregex.test(l)) {
        jpCount++;
      } else if (enregex.test(l)) {
        enCount++;
      } else if (!/[\sw]/i.test(l)){
        other++;
      }
    }
    if (jpCount == enCount) return 0;
    if (jpCount < 3 && enCount < 3 && other > 0) return 0; // it's probably a face
    return  jpCount * 1.7 > enCount ? 1 : -1;
  }
}
