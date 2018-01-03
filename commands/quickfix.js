module.exports.name = 'kanjiCheck';
module.exports.alias = [
  'kc'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* hot fix';

module.exports.command = (message, content, bot, server) => {
  let sortable = [];
  for (var k in server.kanjis) {
    sortable.push([k, server.kanjis[k]]);
  }
  sortable.sort(function(a, b) {
    return b[1] - a[1];
  });
  let str = '';
  for (let k in sortable) {
    str += sortable[k][0] + ':' + sortable[k][1] + ',';
  }
  str = str.substr(0, str.length - 1);
  message.channel.send(str.substr(0, 2000));
};
