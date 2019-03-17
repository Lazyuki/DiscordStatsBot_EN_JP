const Discord = require('discord.js');

module.exports.name = 'help';

module.exports.alias = [
  'help',
  'h',
  'halp',
  'tasukete'
];

module.exports.isAllowed = () => {
  return true;
};
module.exports.help = '`,help` Lists current commands. `,help <command>` to show details. <this is required> [this is optional]';

module.exports.command = (message, content, bot, server, cmds) => {
  let chan = message.channel;
  let cmd = cmds.commands[content];
  let msg;  
  const embed = new Discord.MessageEmbed();

  if (cmd && cmd.isAllowed(message, server, bot)) {
    embed.title = cmd.name;
    embed.description = cmd.help;
    embed.setFooter(`Aliases: ${cmd.alias.join(', ')}`);
    msg = { embed };
  } else {
    msg = '`,help [command]` for more info. Available commands are:\n';
    for (let c in cmds.commandNames) {
      if (cmds.commandNames[c].isAllowed(message, server, bot)) {
        msg += `\`${cmds.commandNames[c].alias[0]}\`, `;
      }
    }
    msg = msg.substr(0, msg.length - 2);    
  }
  chan.send(msg);
};
