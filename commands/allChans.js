module.exports.name = 'allChannels';

module.exports.alias = [
  'channels',
  'ch'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = '`,ch` Displays all the channels in the message count order';

module.exports.command = (message, content, bot, server) => {
  let ignoreHidden = !server.hiddenChannels.includes(message.channel.id);
  let allch = {};
  for (let id in server.users) {
    let user = server.users[id];
    for (let ch in user.chans) {
      if (server.hiddenChannels.includes(ch) && ignoreHidden) continue;
      if (ch == '293787390710120449') {
        delete server.users[id].chans[ch];
        continue;
      }
      if (allch[ch]) {
        allch[ch] += user.chans[ch];
      } else {
        allch[ch] = user.chans[ch];
      }
    }
  }

  // Sort by number of messages
  let sortable = [];
  for (let c in allch) {
    sortable.push([c, allch[c]]);
  }
  sortable.sort(function(a, b) {
    return b[1] - a[1];
  });

  let s = '';
  for (let i in sortable) {
    s += `<#${sortable[i][0]}> : ${sortable[i][1]}\n`;
  }
  message.channel.send(s);
};
