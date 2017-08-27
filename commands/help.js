module.exports.alias = [
	'help',
  'h',
  'halp',
	'tasukete'
];

module.exports.command = (message, content, bot) => {
  let chan = message.channel;
	chan.send(
		'Current commands are \n\`leaderboard (lb)\`\n\`channel-leaderboard (chlb)\`\n\`user (u)\`\n\`channels (ch)\`\n\`snowflake (id)\`\n\`clear (clr)\`');
};
