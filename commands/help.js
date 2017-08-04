module.exports.alias = [
	'help',
  'h',
  'halp',
	'tasukete'
];

module.exports.command = (message, content, bot) => {
  let chan = message.channel;
	chan.send(
		'Current commands are \`leaderboard (lb)\`, \`channel-leaderboard (chlb)\`, \`user (u)\`, \`snowflake (id)\` and \`clr\`');
};
