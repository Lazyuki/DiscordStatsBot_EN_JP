module.exports.alias = [
  'restart',
  'reboot'
];

module.exports.command = (null, null, bot) => {
  setTimeout(bot.destroy(), 0);
  setTimeout(process.exit(2), 0);
};
