module.exports.alias = [
	'help',
  'h',
  'halp'
];

module.exports.command = (message, content, bot) => {
  let chan = message.channel;
	chan.send('Current commands are lb, chlb, and clr')
}
