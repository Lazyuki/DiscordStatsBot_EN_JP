const fs = require('fs');
module.exports.name = 'migrate';

module.exports.alias = ['migrate'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help =
  'add migrated commands. `,migrate add user leaderboard` or `,migreate remove user`';

module.exports.command = (message, content, bot) => {
  if (content) {
    const [subCommand, ...commands] = content.split(' ');
    if (subCommand === 'add' || subCommand === 'remove') {
      const init = require('./init.json');
      for (const commandName of commands) {
        const command = bot.commands[commandName];
        if (command) {
          command.isCirillaCommand = subCommand === 'add';
          if (subCommand === 'add') {
            bot.migratedCommands.push(commandName);
          } else {
            bot.migratedCommands = bot.migratedCommands.filter(
              (c) => c !== commandName
            );
          }
        } else {
          message.channel.send(`${commandName} is not a command`);
        }
      }
      fs.writeFileSync(
        'init.json',
        JSON.stringify(
          { ...init, migratedCommands: bot.migratedCommands },
          null,
          4
        ),
        'utf8'
      );
      message.channel.send(`Done`);
    } else {
      message.channel.send('Available subcommands are add and remove');
    }
  } else {
    message.channel.send(
      `Migrated commands: ${bot.migratedCommands.join(', ')}`
    );
  }
};
