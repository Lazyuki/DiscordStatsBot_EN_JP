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
		msg += '**Welcoming Party Commands:**\n\`tag (t)\`: `,t <nj | fj | ne | fe | ol> [@someone, or 1, 2, 3]` See the pin in <#277384105245802497>\n';
		msg += '\`nofilter (nf)\`: sends people to ~~oblivion~~ <#193966083886153729> for 5 minutes. \`,nf @someone @sometwo @somethree\`\n';
	}
	if (message.member.hasPermission('ADMINISTRATOR') && server.hiddenChannels.includes(message.channel.id)) {
		msg += '**Mod Commands** \n\`hide\`, \`hidden\`, and \`unhide\` for hiding channels (use IDs).\n' +
			'\`watch\`, \`watched\`, and \`unwatch\` for tracking deleted messages of a specific user. Use ID or mention. Names won\'t work. \n' +
		  '\`mutenew\` mutes new users in text chat. do the same command again to disable. **Intended for raids**\n' +
			'\`auditlog (al)\` shows the last 5 interesting audit logs.';
	}
	chan.send(msg);

};
