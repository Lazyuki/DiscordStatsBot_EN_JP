module.exports = class Util {
  static searchUser(message, content, server) {
    let mentions = message.mentions.users;
    let uesr = null;
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
}
