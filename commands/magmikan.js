const Discord = require('discord.js');

module.exports.name = 'magmikan';
module.exports.alias = [
  'magmikan',
  'mag'
];
module.exports.initialize = (json, server) => {
  server.lastmag = '';
  if (!json || !json['lastmag']) return;
  server.lastmag = json['lastmag'];
};
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};

module.exports.help = 'Check & ban magmikan. `,mag check <ID>` or `,mag ban <ID>`';

const Util = require('../classes/Util.js');

module.exports.command = async (message, content, bot, server) => {
  const id = content.match(Util.REGEX_RAW_ID);
  if (!id) {
    message.channel.send('ID or mention them')
    return;
  }
  const date = Discord.SnowflakeUtil.deconstruct(id).date;
  const command = content.split(' ')[0];
  switch (command) {
    case 'check':
      let diff = date - new Date(server.lastmag);
      let isBefore = false;
      if (diff < 0) {
        isBefore = true;
        diff = 0 - diff;
      };
      const m = Math.floor(diff / (60 * 1000));
      const hr = Math.floor(m / 60);
      const min = m % 60;
      message.channel.send(`Account created: ${hr} hrs ${min} mins ${isBefore ? 'before' : 'after'} the last time magmikan was banned`);
      return;
    case 'ban':
      if (message.member.id === bot.owner_ID) {
        const mem = server.guild.member(id);
        mem.ban({ days: 0, reason: `(Issued by ${message.author.tag}) Magmikan` });
        message.channel.send('✅ Banned');
        server.lastmag = new Date().getTime();
        return;
      } else {
        message.channel.send('Only Geralt can ban them with this command')
        return;
      }
    default:
      message.channel.send('Usage: `,mag check <user>` or `,mag ban <user>`')
      return;
  }
};
