module.exports.name = 'quickFix';
module.exports.alias = [
  'fix'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server    
  return message.author.id == bot.owner_ID;
};

module.exports.help = '*Bot owner only* hot fix';
const fs = require('fs');
module.exports.command = (message, content, bot) => {
  for (let s of Object.values(bot.servers)) {
    if (fs.existsSync(`./backups/${s.guild.id}_log-11-18-2019.json`)) {
      let json = JSON.parse(fs.readFileSync(`./backups/${s.guild.id}_log-11-18-2019.json`, 'utf8'));
      s.sars = json['sars'] || {};
      s.categoryClocks = json['categoryClocks'] || [];
    }
  }

  message.channel.send('done');
};