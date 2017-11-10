const Discord = require('discord.js');

const IgnoredActions = ['INVITE_CREATE', 'MEMBER_UPDATE']

module.exports.alias = [
	'audit',
	'al'
];

function isInteresting(e) {
	if (e.executor.id == '309878089746219008') return false; // Canti
	if (IgnoredActions.indexOf(e.action) != -1) return false;
	if (e.action == 'MEMBER_ROLE_UPDATE' &&
			(e.executor.id == '116275390695079945' || e.executor.id == '172002275412279296')) return false; // Nadeko/Tatsu assigning roles
	return true;
}

function sameEntry(e, prev) {
	if (e.action != prev['action']) return false;
	if (e.executor.id != prev['exeID']) return false;
	if (e.target.id != prev['targetID']) return false;
	return true;
}

function embedEntry(entries) {
	let embed = new Discord.RichEmbed();
	let e = entries[0];
	embed.setAuthor(`${e.executor.tag}`, e.executor.avatarURL)
	embed.title = `${e.action}`;
	switch (e.targetType) {
		case 'USER':
			embed.addField('Target User', e.target.tag, false);
			break;
		case 'ROLE':
			embed.addField('Target Role', e.target.name, false);
			break;
		default:
			if (e.action == 'MESSAGE_DELETE') {
				embed.addField('Message Author', e.target.tag, false);
				embed.addField('Channel', `#${e.extra.channel.name}`, false);
				break;
			}
			embed.addField('TargetType', e.targetType, false);
	}
	for (var i in entries) {
		let ent = entries[entries.length - 1 - i];
		if (ent.changes) {
			let title = ent.changes[0].key;
			if (ent.reason) title += ` with reason: ${ent.reason}`;
			if (ent.changes[0].new[0]) embed.addField(title, ent.changes[0].new[0].name, false);
			else embed.addField(title, ent.changes[0].new, false)
		}
	}
	switch (e.actionType) {
		case 'CREATE':
			embed.color = Number('0x66ff33');
			break;
		case 'UPDATE':
			embed.color = Number('0xff9900');
			break;
		case 'DELETE':
			embed.color = Number('0xff3300');
	}
	embed.timestamp = e.createdAt;
	return embed;
}

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('ADMINISTRATOR')) return;
	try {
		let guild = server.guild;
		var max = parseInt(content);
		if (!max || max > 10) max = 5;
		if (true) { // last 5 changes
			let al = await guild.fetchAuditLogs({limit:100});
			var count = 0;
			var prev = {'action':'', 'exeID':'', 'targetID': '', 'entries': []};
			for (var e of al.entries.values()) {
				if (!isInteresting(e)) continue;
				if (sameEntry(e, prev)) {
					if (!e.changes) continue;
					prev['entries'].push(e);
					continue;
				}
				let preves = prev['entries'];
				prev['action'] = e.action;
				prev['exeID'] = e.executor.id;
				prev['targetID'] = e.target.id;
				prev['entries'] = [e];
				if (preves.length) {
					let embed = embedEntry(preves);
					await message.channel.send({embed});
					if (++count == max) break;
				}
			}
			if (prev['entries'].length > 1) { // run out of entries
				let embed = embedEntry(prev['entries']);
				message.channel.send({embed});
			}
		}
	} catch (e) {
		message.channel.send(`${e.message}\nYou better fix this shit <@${bot.owner_ID}>`);
	}
};
