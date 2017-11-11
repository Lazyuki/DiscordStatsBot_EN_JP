module.exports.alias = [
	'help',
  'h',
  'halp',
	'tasukete'
];

module.exports.command = (message, content, bot, server) => {
  let chan = message.channel;
	var msg = '**Commands:**\n\`leaderboard (lb)\`\n\`channel-leaderboard (chlb)\`\n\`user (u)\`\n\`channels (ch)\`\n\`snowflake (id)\`\n\`clear (clr)\`\n';
	if (message.member.hasPermission('MANAGE_ROLES')) {
		msg += '**Welcoming Party Commands:**\n\`tag (t)\`:  See the pin in <#277384105245802497> `,t <nj | fj | ne | fe | ol> [(optional) @someone, 1, 2, or 3 ]`\n';
		msg += '\`nofilter (nf)\`: sends people to ~~oblivion~~ <#193966083886153729> for 5 minutes. ***__YOU SHOULD WARN THEM FIRST__*** Only meant to be used as a last resort. \`,nf @someone @sometwo @somethree\`\n';
	}
	if (message.member.hasPermission('ADMINISTRATOR') && server.hiddenChannels.includes(message.channel.id)) {
		msg += '**Mod Commands** \n\`hide\`, \`hidden\`, and \`unhide\` for hiding channels (use IDs).\n' +
			'\`watch\`, \`watched\`, and \`unwatch\` for tracking deleted messages of a specific user. Use ID or mention. Names won\'t work. \n' +
		  '\`mutenew\` mutes new users in text chat. Type the same command again to disable it. **Intended for raids**\n' +
			'\`auditlog (al)\` shows the last 5 interesting audit logs. \`,al 2\` shows the last 2 (MAX is 10). More options coming soon...';
	}
	chan.send(msg);

};
