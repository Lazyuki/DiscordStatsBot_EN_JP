module.exports.alias = [
	'd',
	'del',
  'delete'
];

module.exports.command = (message, content) => {
  let channel = message.channel;
  let num = parseInt(content);
  if (isNaN(num)) return;
  channel.bulkDelete(num + 1);
};
