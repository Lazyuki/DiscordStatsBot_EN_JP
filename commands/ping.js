module.exports.name = 'ping';

module.exports.alias = [
  'ping'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = 'Ping in milliseconds';

module.exports.command = async (message) => {
  let now = new Date().getTime();
  // let dateBefore = Discord.SnowflakeUtil.deconstruct(message.id).date;
  let sent = await message.channel.send('calculating...');
  let now2 = new Date().getTime();
  sent.edit(`${now2 - now} ms`);
};
