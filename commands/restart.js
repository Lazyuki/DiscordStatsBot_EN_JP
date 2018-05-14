module.exports.name = 'restart';

module.exports.alias = [
  'restart',
  'reboot',
  'rs'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Restart the bot.';

module.exports.command = async (message, cont, bot) => {
  if (message.author.id != bot.owner_ID) return;
  
  await message.channel.send('Restarting...');
  for (let s in bot.servers) {
    let server = bot.servers[s];
    server.processors['VOICE'].forEach((p) => {
      p.end(server);    
    });
    delete server.invites;
    server.save();
  }
  bot.destroy().then(() => {
    process.exit(2);
  }, (err) => {
    console.log(err);
  });
};
