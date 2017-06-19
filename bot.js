const discord = require('discord.js');
const config = require('./config.json');
const bot2 = require('./server.js');
const bot = new discord.Client();

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
});

bot.on('message', message => {


  if (message.author.id != owner_ID) return;
  if (!message.content.startsWith(prefix)) return;

  let command = message.content.split(' ')[0].slice(1);
  let content = message.content.substr(command.length + 1);
  if (!commands[command]) return;
  commands[command].command(message, content, bot);
});

// Log in. This should be the last call
bot.login(token);
