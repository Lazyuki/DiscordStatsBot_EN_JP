const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();
const Server = require('./classes/Server.js');
const midnightTask = require('./classes/midnightTask.js');
const savingTask = require('./classes/savingTask.js');
const commands = require('./cmds.js');

// Load configurations.
const token = config.token;
bot.owner_ID = config.owner_ID;
const prefix = config.prefix;


bot.on('ready', () => {
  setTimeout(() => { // sets up the saving restore state task
    savingTask(bot);
  },  60*60*1000);
  let time = new Date();
  let h = time.getUTCHours();
  let m = time.getUTCMinutes();
  let s = time.getUTCSeconds();
  let timeLeft = (24*60*60) - (h*60*60) - (m*60) - s;
  setTimeout(() => { // sets up the day changing task
    midnightTask(bot);
  },  timeLeft * 1000); // timeLeft * 1000
  console.log('Logged in as ' + bot.user.username);
  console.log(`${time.toLocaleDateString()} ${time.toLocaleTimeString()}`);
  console.log('--------------------------');
  bot.servers = {};
  for (var guild of bot.guilds.values()) {
    if (guild.id == '293787390710120449') continue; // My testing server
    bot.servers[guild.id] = new Server(guild);
  }
  let helps = [',help',',h',',halp',',tasukete'];
  bot.user.setGame(helps[Math.floor(Math.random() * helps.length)]);
});

bot.on('message', async message => {
  if (message.author.bot) return;
  if (message.system) return;
  if (message.channel.type != 'text') {
    let msgs = [
      'Come on... I\'m not available here... \n https://media3.giphy.com/media/mfGYunx8bcWJy/giphy.gif',
      '*sigh* Why did you PM me https://68.media.tumblr.com/d0238a0224ac18b47d1ac2fbbb6dd168/tumblr_nselfnnY3l1rpd9dfo1_250.gif',
      'I don\'t work here ¯\\\_(ツ)\_/¯ http://cloud-3.steamusercontent.com/ugc/576816221180356023/FF4FF60F13F2A773123B3B26A19935944480F510/'];
    var msg = msgs[Math.floor(Math.random() * msgs.length)];
    if (message.content.startsWith(prefix)) {
      message.channel.send(msg);
    }
    return;
  }
  let testServer = message.guild.id == '293787390710120449'; // My testing server
  if (!message.content.startsWith(prefix)) {
    if (testServer) return;// Ignore my server
    bot.servers[message.guild.id].addMessage(message);
    return;
  }

  let command = message.content.split(' ')[0].slice(1).toLowerCase();
  let content = message.content.substr(command.length + 2).trim();
  if (!commands[command]) { // if not Ciri bot command, add it.
    if (testServer) return;
    bot.servers[message.guild.id].addMessage(message);
    return;
  }
  let server = testServer ? bot.servers['189571157446492161'] : bot.servers[message.guild.id]; // defaults commands to EJLX
  commands[command].command(message, content, bot, server);
});

bot.on('messageUpdate', (oldMessage, newMessage) => {
  if (oldMessage.content == newMessage.content) return; // Discord auto embed for links.
  if (oldMessage.channel.type != 'text') return;
  if (oldMessage.guild.id == '293787390710120449') return; // Ignore my server

  bot.servers[oldMessage.guild.id].addEdits(oldMessage, newMessage);
});

bot.on('messageDelete', message => {
  if (message.author.bot) return;
  if (message.channel.type != 'text') return;
  if (message.guild.id == '293787390710120449') return; // Ignore my server

  bot.servers[message.guild.id].addDeletedMessage(message);
});

bot.on('messageDeleteBulk', messages => {
  let m = messages.first();
  if (m.author.bot) return;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') return; // Ignore my server
  for (var [id, message] of messages) {
    bot.servers[message.guild.id].addDeletedMessage(message);
  }
});

bot.on('messageReactionAdd', async (reaction, user) => {
  let m = reaction.message;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[m.guild.id].processReaction(reaction, user, true);
});

bot.on('messageReactionRemove', async (reaction, user) => {
  let m = reaction.message;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[reaction.message.guild.id].processReaction(reaction, user, false);

});

bot.on('guildMemberAdd', member => {
  // check mee6 message?
  if (member.guild.id == '293787390710120449') return;
  bot.servers[member.guild.id].addNewUser(member.id);
});

bot.on('guildBanAdd', (guild, user) => {
  if (guild.id == '293787390710120449') return;
  var index = bot.servers[guild.id].watchedUsers.indexOf(user.id);
  if (index == -1) return;
  bot.servers[guild.id].watchedUsers.splice(index, 1);
});

bot.on('guildCreate', guild => {
  bot.servers[guild.id] = new Server(guild);
  console.log(`Server added: ${guild.name}`);
});

bot.on('guildDelete', guild => {
  var index = bot.servers.indexOf(guild.id);
  if (index == -1) return;
	bot.servers.splice(index, 1);
  console.log(`Server removed: ${guild.name}`);
});

process.on('unhandledRejection', console.dir);

// Log in. This should be the last call
bot.login(token);
