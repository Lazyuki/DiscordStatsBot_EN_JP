module.exports.name = 'unignore';
module.exports.alias = ['unignore'];
module.exports.isAllowed = (message) => {
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help =
  '`,unignore <#channel | ID>`Unignore a channel from the list of ignored channels.';

module.exports.command = (message, content, bot, server) => {
  let arr = server.ignoredChannels;
  let chan = server.guild.channels.cache.get(content);
  if (chan) {
    let index = arr.indexOf(content);
    if (index == -1) return;
    arr.splice(index, 1);
    message.channel.send(`<#${content}> is no longer ignored`);
  } else if (message.mentions.channels.size != 0) {
    for (let [id] of message.mentions.channels) {
      let index = arr.indexOf(id);
      if (index == -1) return;
      arr.splice(index, 1);
      message.channel.send(`<#${id}> is no longer ignored`);
    }
  }
};
