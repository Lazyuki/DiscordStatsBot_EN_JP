const discord = require('discord.js');
const config = require('./config.json');
const bot = new discord.Client();
const Server = require('./server.js');

// Load configurations.
const token = config.token;
const owner_ID = config.owner_ID;
const prefix = config.prefix;

const commands = require('./cmds.js');


bot.on('ready', () => {
  let time = new Date();
  console.log('Logged in as ' + bot.user.username);
  console.log(`${time.toLocaleDateString()} ${time.toLocaleTimeString()}`);
  console.log('--------------------------');
  bot.server = new Server(bot.guilds.firstKey());
});

bot.on('message', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) {
    bot.server.addMessage(message);
    return;
  }
  if (message.author.id != owner_ID) return; // remove this
  let command = message.content.split(' ')[0].slice(1);
  let content = message.content.substr(command.length + 1);
  if (!commands[command]) { // if not our bot command, process it.
    bot.server.addMessage(message);
    return;
  }
  commands[command].command(message, content, bot);
});

// Log in. This should be the last call
bot.login(token);
