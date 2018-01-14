module.exports.name = 'unhide';
module.exports.alias = [
  'unhide'
];
module.exports.isAllowed = (message, server) => {
  return message.member.hasPermission('ADMINISTRATOR') && server.hiddenChannels.includes(message.channel.id);
};

module.exports.help = '`,unhide <#channel | ID>` Unhide a channel from the list of hidden channels.';

module.exports.command = (message, content, bot, server) => {
  let arr = server.hiddenChannels;
  let chan = server.guild.channels.get(content);
  if (chan) {
    let index = arr.indexOf(content);
    if (index == -1) return;
    arr.splice(index, 1);
    message.channel.send(`<#${content}> is no longer hidden`);
  } else if (message.mentions.channels.size != 0) {
    for (let [id,] of message.mentions.channels) {
      let index = arr.indexOf(id);
      if (index == -1) return;
      arr.splice(index, 1);
      message.channel.send(`<#${id}> is no longer hidden`);
    }
  }
};
