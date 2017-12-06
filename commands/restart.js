module.exports.alias = [
  'restart',
  'reboot',
  'rs'
];

module.exports.command = async (message, cont, bot) => {
  if (message.author.id != bot.owner_ID) return;
  await message.channel.send("Restarting...");
  for (var s in bot.servers) {
    bot.servers[s].save();
  }
  bot.destroy().then((val) => {
    process.exit(2);
  }, (err) => {
    console.log(err);
  });
};
