const fs = require('fs');
const nohup = './nohup.out';

module.exports.name = 'error';
module.exports.alias = ['error'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help = "`,error` Shows Ciri's error log.";

module.exports.command = (message, content) => {
  if (content == 'reset') {
    fs.writeFile(nohup, '', function (err) {
      if (err) {
        message.channel.send('write failed: ' + err);
        return;
      }
      message.channel.send('done');
    });
  } else {
    fs.readFile(nohup, 'utf8', function (err, data) {
      if (err) {
        message.channel.send('read failed: ' + err);
        return;
      }
      if (data.length > 2000) {
        message.channel.send(`\`\`\`${data.substr(data.length - 1990)}\`\`\``);
      } else {
        message.channel.send(`\`\`\`${data ? data : 'Empty'}\`\`\``);
      }
    });
  }
};
