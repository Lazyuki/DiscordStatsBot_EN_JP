module.exports.alias = [
  'restart',
  'reboot',
  'rs'
];

module.exports.command = (msg, cont, bot) => {
  if (message.author.id != bot.owner_ID) return;
  bot.server.save();
  bot.destroy().then((val) => {
    process.exit(2);
  }, (err) => {
    console.log(err);
  });
};
