const fs = require('fs');
module.exports.name = 'migrate';

module.exports.alias = ['migrate'];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false; // My server
  return message.author.id == bot.owner_ID;
};

module.exports.help =
  'add migrated commands. `,migrate add user leaderboard` or `,migreate remove user`';

module.exports.command = (message, content, bot, server) => {
  if (content) {
    const [subCommand, ...commands] = content.split(' ');
    if (subCommand === 'add' || subCommand === 'remove') {
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
          return;
        }
      }
      const init = fs.readFileSync('./init.json');
      const initJson = JSON.parse(init);
      fs.writeFileSync(
        './init.json',
        JSON.stringify(
          { ...initJson, migratedCommands: bot.migratedCommands },
          null,
          4
        ),
        'utf8'
      );
      message.channel.send(`Done`);
    } else if (subCommand === 'wl') {
      if (!server.warnlist) {
        message.channel.send('no warnlist');
        return;
      }
      const modLogEntries = [];
      Object.entries(server.warnlist).forEach(([userId, warnlogs]) => {
        warnlogs.forEach((wl) => {
          let kind = 'warn';
          let content = wl.warnMessage;
          if (content.startsWith('Banned:')) {
            return;
          }
          if (content.startsWith('Kicked:')) {
            return;
          }
          if (content.startsWith('Sent to')) {
            return;
          }
          if (content.startsWith('Chat muted')) {
            kind = 'mute';
            content = 'Unspecified';
          }
          if (content.startsWith('Temp muted')) {
            kind = 'mute';
            if (content.startsWith('Temp muted:')) {
              const reason = content.replace('Temp muted:', '').trim();
              content = reason;
            } else {
              content = 'Unspecified';
            }
          }
          if (content.startsWith('Voice muted')) {
            kind = 'voicemute';
            content = 'Unspecified';
          }
          modLogEntries.push({
            guildId: server.guild.id,
            userId,
            kind,
            silent: wl.silent,
            date: new Date(wl.issued).toISOString(),
            issuerId: wl.issuer,
            messageLink: wl.link,
            content,
          });
        });
      });
      fs.writeFileSync(
        `${server.guild.id}-warnlist.json`,
        JSON.stringify({ modLogEntries }, null, 4),
        'utf-8'
      );
      message.channel.send('done');
    } else if (subCommand === 'watched') {
      fs.writeFileSync(
        `${server.guild.id}-watched.json`,
        JSON.stringify({ watched: server.watchedUsers }, null, 4),
        'utf-8'
      );
      message.channel.send('done');
    } else {
      message.channel.send(
        'Available subcommands are add, remove, wl, watched'
      );
    }
  } else {
    message.channel.send(
      `Migrated commands: ${bot.migratedCommands.join(', ')}`
    );
  }
};
