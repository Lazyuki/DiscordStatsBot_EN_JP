module.exports.alias = [
	'help',
  'h',
  'halp',
	'tasukete'
];

module.exports.command = (message, content, bot, server) => {
  let chan = message.channel;
	var msg = '**Commands:**\n\`leaderboard (,lb)\`\n\`channel-leaderboard (,chlb [#channel])\`\n\`user (,u [name])\`\n\`channels (,ch)\`\n\`snowflake (,id)\`\n\`clear (,clr [num])\`\n';
	if (message.member.hasPermission('MANAGE_ROLES')) {
		msg += '\n**Welcoming Party Commands:**\n\`tag (t)\`:  See the pin in <#277384105245802497> `,t <nj | fj | ne | fe | ol> [(optional) @someone, 1, 2, or 3 ]`\n';
		msg += '\`nofilter (nf)\`: sends people to ~~oblivion~~ <#193966083886153729> for 5 minutes. ***__YOU SHOULD WARN THEM FIRST.__*** Only meant to be used as a last resort. \`,nf @someone @sometwo @somethree\`\n';
		msg += '\`auditlog (al)\` shows the last few interesting audit logs. \`,al [number <= 10 (default = 3)] [ALL_CAPS_ACTION] [@mention] \` Actions: <https://github.com/hydrabolt/discord.js/blob/stable/src/structures/GuildAuditLogs.js#L16>\n';
	}
	if (message.member.hasPermission('ADMINISTRATOR')) {
		msg += '\n**Mod Commands**:\n' +
		  '\`mutenew\` mutes new users in text chat. Type the same command again to disable it. **Intended for raids**\n' +
      '\`prune\` deletes messages sent by specified users in the channel in the past 24 hours. Use their IDs. \`,prune 123454323454 2345432345643 4543246543234\`\n';
			if (~server.hiddenChannels.indexOf(message.channel.id)) {
				msg += '\`hide\`, \`hidden\`, and \`unhide\` for hiding channels (use IDs).\n' +
						'\`watch\`, \`watched\`, and \`unwatch\` for tracking deleted messages of a specific user. Use ID or mention. Names won\'t work. \n'
			}
	}
	chan.send(msg);
};
