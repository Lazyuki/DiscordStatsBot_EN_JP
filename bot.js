const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();
const Server = require('./server.js');
const SimpleMsg = require('./SimpleMessage.js');
const midnightTask = require('./midnightTask.js');

// Load configurations.
const token = config.token;
bot.owner_ID = config.owner_ID;
const prefix = config.prefix;

const commands = require('./cmds.js');

bot.on('ready', () => {
  let time = new Date();
  let h = time.getUTCHours();
  let m = time.getUTCMinutes();
  let s = time.getUTCSeconds();
  let timeLeft = (24*60*60) - (h*60*60) - (m*60) - s;
  setTimeout(() => { // set up the day changing task
    midnightTask(bot);
  },  timeLeft * 1000); // timeLeft * 1000
  console.log('Logged in as ' + bot.user.username);
  console.log(`${time.toLocaleDateString()} ${time.toLocaleTimeString()}`);
  console.log('--------------------------');
  if (!bot.server) bot.server = new Server(bot.guilds.get('189571157446492161'));
  bot.deletedMessages = [];
});

bot.on('message', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) {
    if (message.guild.id != '189571157446492161') return; // ONLY EJLX
    bot.server.addMessage(message);
    return;
  }
  //if (message.author.id != owner_ID) return; // remove this
  let command = message.content.split(' ')[0].slice(1).toLowerCase();
  let content = message.content.substr(command.length + 2);
  if (!commands[command]) { // if not Ciri bot command, add it.
    bot.server.addMessage(message);
    return;
  }
  commands[command].command(message, content, bot);
});

bot.on('messageDelete', message => {
  if (message.author.bot) return;
  if (message.author.id == bot.owner_ID) return; // if mine.
  let con = message.content;
  if (message.content.length < 5) return; // don't log short messages
  if (con.startsWith('.') || con.startsWith('t!')
      || con.startsWith('!') || con.startsWith(':')) return;  // no bot messages
  let arr = bot.deletedMessages;
  arr.push(new SimpleMsg(message));
  if (arr.length > 50) arr.shift();
});

// Log in. This should be the last call
bot.login(token);
