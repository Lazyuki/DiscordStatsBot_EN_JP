module.exports.name = 'data';

module.exports.alias = [
  'data'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = '`,data [number of min messages]` Shows the bot\'s statistics.';

function msToTime(duration) {
  let seconds = parseInt((duration/1000)%60)
    , minutes = parseInt((duration/(1000*60))%60)
    , hours = parseInt((duration/(1000*60*60))%24)
    , days = parseInt((duration/(1000*60*60*24)));

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

module.exports.command = (message, content, bot) => {
  let uptime = msToTime(bot.uptime);
  let res = `Uptime: ${uptime}\n\n`;
  for (let s in bot.servers) {
    let server = bot.servers[s];
    res += `Server: ${server.guild.name}\n`;
    res += `Number of tracked users: ${Object.keys(server.users).length}\n`;
    let num = parseInt(content);
    if (!num) num = 0;
    let moreThan = 0;
    for (let user in server.users) {
      if (server.users[user].thirty > num) {
        moreThan++;
      }
    }
    res += `${moreThan} people have talked more than ${num} messages.\n`;
    res += `Date number: ${server.today}\n\n`;
  }
  res += `UTC Time: ${new Date().toUTCString()}`;
  message.channel.send(res);
};
