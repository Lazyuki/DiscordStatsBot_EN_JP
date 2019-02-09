const exec = require('child_process').exec;
module.exports.name = 'gitpull';

module.exports.alias = [
  'gpl'
];

module.exports.isAllowed = (message, server, bot) => {
  return message.author.id == bot.owner_ID;
};

module.exports.help = '__Owner only__: update ciri';


module.exports.command = async (message) => {
  exec('cd /home/yuwkeeto/DiscordStatsBot_EN_JP && git pull', function(err, stdout, stderr) {
    if (err) {
      message.channel.send(stderr); 
      return;
    }
    message.channel.send(stdout);
  });
};
