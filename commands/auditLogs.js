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
	embed.setAuthor(`${capsToNormal(e.action)} by ${e.executor.username}`, e.executor.avatarURL);
	var str = '';
	switch (e.targetType) {
		case 'USER':
			str += `__Target User__: \`${e.target.tag}\`\n`;
			break;
		case 'ROLE':
			str += `__Target Role__: \`${e.target.name}\`\n`;
			break;
		case 'CHANNEL':
			str += `__Target Channel__: \`#${e.target.name}\`\n`;
			break;
		default:
			if (e.action == 'MESSAGE_DELETE') {
				str += `__Message by__: \`${e.target.tag}\` in \`#${e.extra.channel.name}\`\n`;
				break;
			}
			str += `__TargetType__: \`${e.targetType}\`\n`;
	}
	for (var i in entries) {
		let ent = entries[entries.length - 1 - i];
		if (ent.changes) {
			let title = ent.changes[0].key.replace('$', '');
			let reason = '';
			if (ent.reason) reason = ` : ${ent.reason}`;
			if (ent.changes[0].new[0]) { // Roles
				if (ent.changes[0].new[0].name) {
					str += `・**${capsToNormal(title.toUpperCase())}**: \`${ent.changes[0].new[0].name}\`${reason}\n`;
				} else {
					str += `・**${capsToNormal(title.toUpperCase())}**: \`${JSON.stringify(ent.changes[0].new)}\`${reason}\n`;
				}
      } else if (ent.changes[0].new) {
				if (title == 'permissions') {
					let perm = ent.changes[0].new ^ ent.changes[0].old;
					let permKey = Object.keys(Discord.Permissions.FLAGS).find(key => Discord.Permissions.FLAGS[key] == perm);
					if ((perm & ent.changes[0].old) == 0) {
						str += `・**Granted**: \`${permKey}${reason}\`\n`;
					} else {
						str += `・**Denied**: \`${permKey}${reason}\`\n`;
					}
				} else if (title == 'deny') {
					let perm = ent.changes[0].new ^ ent.changes[0].old;
					let permKey = Object.keys(Discord.Permissions.FLAGS).find(key => Discord.Permissions.FLAGS[key] == perm);
					if ((perm & ent.changes[0].old) == 0) { // TODO this is fucked up. the order is opposite. LMAO
						str += `・**Denied**: \`${permKey} from ${JSON.stringify(e.extra)}${reason}\`\n`;
					} else {
						str += `・**Granted**: \`${permKey} from ${JSON.stringify(e.extra)}${reason}\`\n`;
					}
				} else {
					str += `・**${title}**: \`${ent.changes[0].new}\`${reason}\n`;
				}
      } else {
				str += `・**${title}**: \`${JSON.stringify(ent.changes)}\`${reason}\n`;
			}
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
  embed.description = `${str}`;
	return embed;
}

function capsToNormal(caps) {
	let arr = [];
	for (var w of caps.split('_')) {
		w = w[0] + w.substr(1, w.length).toLowerCase();
		arr.push(w)
	}
	return arr.join('');
}

function normalEntry(entries) {
	var str = '';
	let e = entries[0];
	str += `__${capsToNormal(e.action)}__ by \`${e.executor.tag}\`\n`
	switch (e.targetType) {
		case 'USER':
			str += `・**Target User**: \`${e.target.tag}\`\n`;
			break;
		case 'ROLE':
			str += `・**Target Role**: \`${e.target.name}\`\n`;
			break;
		case 'CHANNEL':
			str += `・**Target Channel**: \`#${e.target.name}\`\n`;
			break;
		default:
			if (e.action == 'MESSAGE_DELETE') {
				str += `・**Message by**: \`${e.target.tag}\` in \`#${e.extra.channel.name}\`\n`;
				break;
			}
			str += `・**TargetType**: \`${e.targetType}\`\n`;
	}
	for (var i in entries) {
		let ent = entries[entries.length - 1 - i];
		if (ent.changes) {
			let title = ent.changes[0].key.replace('$', '');
			let reason = '';
			if (ent.reason) reason = ` **with reason:** ${ent.reason}`;
			if (ent.changes[0].new[0]) { // Roles
				if (ent.changes[0].new[0].name) {
					str += `・**${title}**: ${ent.changes[0].new[0].name}${reason}\n`;
				} else {
					str += `・**${title}**: ${JSON.stringify(ent.changes[0].new)}${reason}\n`;
				}
      } else if (ent.changes[0].new) {
				if (title == 'permissions') {
					let perm = ent.changes[0].new ^ ent.changes[0].old;
					let permKey = Object.keys(Discord.Permissions.FLAGS).find(key => Discord.Permissions.FLAGS[key] == perm);
					if ((perm & ent.changes[0].old) == 0) {
						str += `・**Granted**: \`${permKey}${reason}\`\n`;
					} else {
						str += `・**Denied**: \`${permKey}${reason}\`\n`;
					}
				} else {
					str += `・**${title}**: ${ent.changes[0].new}${reason}\n`;
				}
      } else {
				str += `・**${title}**: ${JSON.stringify(ent.changes)}${reason}\n`;
			}
		}
	}
	//embed.timestamp = e.createdAt;
	return str;
}

module.exports.command = async (message, content, bot, server) => {
	if (!message.member.hasPermission('MANAGE_ROLES')) return;
	try {
		let guild = server.guild;
		var loopCount = 0;
    var count = 0;
    var beforeID = null;
    let contents = content.split(' ');
    var user = null;
    if (message.mentions.users) user = message.mentions.users.first();
    var max = parseInt(contents[0]);
    var beautiful = contents[contents.length - 1] == '--e';
		if (!max || max > 10) max = 3;
		while (loopCount < 15) { // last 5 changes
			var params = {limit:100};
			if (beforeID) params.before = beforeID;
      if (user) params.user = user.id;
			let al = await guild.fetchAuditLogs(params);
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
          if (beautiful) {
            let embed = embedEntry(preves);
            await message.channel.send({embed});
          } else {
            await message.channel.send(normalEntry(preves));
          }
          if (++count == max) {
            break;
          }
				}
			}
      if (prev['entries'].length > 1) { // run out of entries
        if (beautiful) {
          let embed = embedEntry(preves);
          await message.channel.send({embed});
        } else {
          await message.channel.send(normalEntry(preves));
        }
      }
			if (count < max) {
				loopCount++;
				beforeID = al.entries.lastKey();
			} else {
				break;
			}
		}
	} catch (e) {
		console.log(e);
		message.channel.send(`${e.message}\nYou better fix this shit <@${bot.owner_ID}>`);
	}
};
