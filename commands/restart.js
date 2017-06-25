module.exports.alias = [
  'restart',
  'reboot',
  'rs'
];

module.exports.command = (msg, cont, bot) => {
  bot.server.save();
  bot.destroy().then((val) => {
    process.exit(2);
  }, (err) => {
    console.log(err);
  });
};
