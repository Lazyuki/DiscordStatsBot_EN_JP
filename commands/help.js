module.exports.alias = [
	'help',
  'h',
  'halp',
	'tasukete'
];

module.exports.command = (message, content, bot, server) => {
  let chan = message.channel;
	chan.send(
		'Current commands are \n\`leaderboard (lb)\`\n\`channel-leaderboard (chlb)\`\n\`user (u)\`\n\`channels (ch)\`\n\`snowflake (id)\`\n\`clear (clr)\`');
	if (message.member.hasPermission('ADMINISTRATOR') && server.hiddenChannels.includes(message.channel.id)) {
		chan.send('Current mod commands are \n\`hide\`, \`hidden\`, and \`unhide\` for hiding channels (use IDs).\n' +
			'\`watch\`, \`watched\`, and \`unwatch\` for tracking deleted messages of a specific user. Use ID or mention. Names won\'t work. \n' +
		  '\`mutenew\` mutes new users in text chat. do the same command again to disable. **Intended for raids**\n' +
			'\`auditlog\` shows the last 5 interesting audit logs. ');
	}
};
