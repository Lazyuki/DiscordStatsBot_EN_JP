const Discord = require('discord.js');
const init = require('./init.json');
const Server = require('./classes/Server.js');
const midnightTask = require('./classes/MidnightTask.js');
const hourlyTask = require('./classes/HourlyTask.js');
let cmds = require('./cmds.js');
const commands = cmds.commands;
const inits = cmds.inits;
const prcs = require('./prcs.js');

// Set up Discord client settings.
// Note: Disabling other events such as user update tends to break everything.
const bot = new Discord.Client({
  disableEveryone: true,
  disabledEvents: [
    'TYPING_START'
  ]
});

// Load initial configurations.
const token = init.token;
bot.owner_ID = init.owner_ID;

let time = new Date();
let h = time.getUTCHours();
let m = time.getUTCMinutes();
let s = time.getUTCSeconds();
let timeLeft = (24*60*60) - (h*60*60) - (m*60) - s;
bot.setTimeout(() => { // Set up the day changing task
  midnightTask(bot);
},  timeLeft * 1000); // Time left until the next day

bot.setTimeout(() => { // Set up hourly task
  hourlyTask(bot);
  bot.setInterval(() => {
    hourlyTask(bot);
  }, 60*60*1000);
},  ((60 - m) * 60 - s + 1) * 1000); // one second more

bot.on('ready', () => {
  console.log('Logged in as ' + bot.user.username);
  console.log(`${time.toLocaleDateString()} ${time.toLocaleTimeString()}`);
  console.log('--------------------------');
  // Initialize the bot and servers.
  bot.servers = {};
  bot.usableEmotes = [];
  for (let guild of bot.guilds.values()) {
    if (guild.id == '293787390710120449') continue;
    bot.servers[guild.id] = new Server(guild, inits, prcs);
  }
  let helps = [',help',',h',',halp',',tasukete'];
  bot.user.setActivity(helps[Math.floor(Math.random() * helps.length)], {type:'LISTENING'});
});

bot.on('message', async message => {
  if (message.author.bot || message.system) return; // Ignore messages by bots and system
  if (message.channel.type === 'dm') { // Direct message.
    respondDM(message);
    return;
  }

  let server = bot.servers[message.guild.id];
  let serverOverride = false;
  if (/^!!\d+,/.test(message.content) && message.author.id == bot.owner_ID) {
    server = bot.servers[message.content.match(/^!!(\d+),/)[1]];
    message.content = message.content.replace(/^!!\d+/, '');
    serverOverride = true;
  }

  // Changes my server to EJLX
  let mine = false;
  if (server == undefined) {
    server = bot.servers['189571157446492161'];
    mine = true;
  }

  // Cache member => prevents weird errors 
  if (!message.member) { 
    message.member = await server.guild.member(message.author);
  }
  // Is it not a command?
  if (!message.content.startsWith(server.prefix)) {
    if (!mine && !serverOverride) server.processNewMessage(message, bot);
    return;
  }
  // Separate the command and the content
  let command = message.content.split(' ')[0].slice(1).toLowerCase();
  let content = message.content.substr(command.length + 2).trim();
  if (commands[command]) { // if Ciri's command
    if (commands[command].isAllowed(message, server, bot)) { // Check permission
      commands[command].command(message, content, bot, server, cmds);
      return;
    }
  }
  if (!mine && !serverOverride) server.processNewMessage(message, bot); // Wasn't a valid command, so process it
});

bot.on('messageUpdate', (oldMessage, newMessage) => {
  if (oldMessage.author.bot || oldMessage.system) return;
  if (oldMessage.content == newMessage.content) return; // Discord's auto embed for links sends this event too
  if (oldMessage.channel.type != 'text') return;
  if (oldMessage.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[oldMessage.guild.id].addEdits(oldMessage, newMessage, bot);
});

bot.on('messageDelete', message => {
  if (message.author.bot || message.system) return;
  if (message.channel.type != 'text') return;
  if (message.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[message.guild.id].addDeletedMessage(message);
});

bot.on('messageDeleteBulk', messages => {
  let m = messages.first();
  if (m.author.bot || m.system) return;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') return; // Ignore my server
  for (let [, message] of messages) {
    bot.servers[message.guild.id].addDeletedMessage(message);
  }
});

bot.on('messageReactionAdd', async (reaction, user) => {
  let m = reaction.message;
  if (user.bot) return;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') {
    if (reaction.emoji.name == '▶') {
      prcs.processors['REACT'][0].process(reaction, user, true, bot.servers['189571157446492161'], bot);
    }
    return; // Ignore my server
  }
  bot.servers[m.guild.id].processReaction(reaction, user, true, bot);
});

bot.on('messageReactionRemove', async (reaction, user) => {
  let m = reaction.message;
  if (user.bot) return;
  if (m.channel.type != 'text') return;
  if (m.guild.id == '293787390710120449') {
    if (reaction.emoji.name == '▶') {
      prcs.processors['REACT'][0].process(reaction, user, false, bot.servers['189571157446492161'], bot);
    }
    return; // Ignore my server
  }
  bot.servers[m.guild.id].processReaction(reaction, user, false, bot);
});

bot.on('raw', async event => { // Discord.js bug, fixed in master?
  if (event.t == 'MESSAGE_REACTION_REMOVE') {
    /* Prepare our event data */
    let { d: data } = event;
    let user = bot.users.get(data.user_id);
    if (user.bot) return;
    let channel = bot.channels.get(data.channel_id);
    if (channel.type != 'text') return;
    if (!channel.messages.has(data.message_id)) return; // Message not in cache
    let message = channel.messages.get(data.message_id);
    let emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    let reaction = message.reactions.get(emojiKey);

    /* Pretend to emit the event */
    if (message.guild.id == '293787390710120449') {
      if (reaction.emoji.toString() == '▶') {
        prcs.processors['REACT'][0].process(reaction, user, false, bot.servers['189571157446492161'], bot);
      }
      return; // Ignore my server
    }
    bot.servers[message.guild.id].processReaction(reaction, user, false, bot);
  }
});

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
  if (oldMember.user.bot) return;
  if (newMember.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[newMember.guild.id].processVoice(oldMember, newMember);
});

bot.on('userUpdate', (oldUser, newUser) => {
  for (let serverID in bot.servers) {
    bot.servers[serverID].userUpdate(oldUser, newUser);
  }
});

bot.on('guildMemberUpdate', (oldMember, newMember) => {
  if (oldMember.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[oldMember.guild.id].memberUpdate(oldMember, newMember);
});

bot.on('guildMemberAdd', member => {
  if (member.guild.id == '293787390710120449') return; // Ignore my server
  bot.servers[member.guild.id].addNewUser(member);
});

bot.on('guildBanAdd', (guild, user) => {
  if (guild.id == '293787390710120449') return;// Ignore my server
  bot.servers[guild.id].banAdd(user);
});

bot.on('guildMemberRemove', (member) => {
  if (member.guild.id == '293787390710120449') return;// Ignore my server
  bot.servers[member.guild.id].removeUser(member);
});

bot.on('guildCreate', guild => {
  bot.servers[guild.id] = new Server(guild, inits, prcs);
  console.log(`Server added: ${guild.name}`);
});

bot.on('guildDelete', guild => {
  // let index = bot.servers.indexOf(guild.id);
  // if (index == -1) return;
  // bot.servers.splice(index, 1);
  console.log(`Server removed: ${guild.name}`);
});

// Respond to DMs since it's not supported there
function respondDM(message) {
  let msgs = [
    'Come on... I\'m not available here... \n https://media3.giphy.com/media/mfGYunx8bcWJy/giphy.gif',
    '*sigh* Why did you PM me https://68.media.tumblr.com/d0238a0224ac18b47d1ac2fbbb6dd168/tumblr_nselfnnY3l1rpd9dfo1_250.gif',
    'I don\'t work here ¯\\\_(ツ)_/¯ http://cloud-3.steamusercontent.com/ugc/576816221180356023/FF4FF60F13F2A773123B3B26A19935944480F510/'];
  let msg = msgs[Math.floor(Math.random() * msgs.length)];
  message.channel.send(msg);
}

process.on('unhandledRejection', console.dir); // Show stack trace on unhandled rejection.

// Log in. This should be the last call
bot.login(token);
