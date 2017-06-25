module.exports.alias = [
  'restart',
  'reboot'
];

module.exports.command = (msg, cont, bot) => {
  bot.destroy();
  process.exit(2);
};
