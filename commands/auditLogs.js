module.exports.name = 'auditLog';

module.exports.alias = [
  'auditlog',
  'al'
];

module.exports.isAllowed = (message) => {
  return message.member.hasPermission('VIEW_AUDIT_LOG');
};

module.exports.help = '__WP Only__ `,al [number <= 20 (default = 3)] [ALL_CAPS_ACTION] [Target User ID] [@mention the executor]` View audit log. Actions: <https://github.com/hydrabolt/discord.js/blob/stable/src/structures/GuildAuditLogs.js#L16>\n';

const Discord = require('discord.js');
const IgnoredActions = ['INVITE_CREATE', 'MEMBER_UPDATE'];

function isInteresting(e) {
  if (e.executor.id == '309878089746219008') return false; // Canti
  if (IgnoredActions.indexOf(e.action) != -1) return false;
  if (e.action == 'MEMBER_ROLE_UPDATE' &&
      (e.executor.id == '116275390695079945' || e.executor.id == '172002275412279296')) return false; // Nadeko/Tatsu assigning roles
  if (e.reason && e.reason == 'self assigned') return false; // Ciri's self assigning 
  return true;
}

function sameEntry(e, prev) {
  if (e.action != prev['action']) return false;
  if (e.executor.id != prev['exeID']) return false;
  if (e.target == null) {
    if (prev['targetID'] != null) return false;
  } else if (e.target.id != prev['targetID']) return false;
  if (e.extra == null) return prev['extraID'] == null;
  if (e.extra.channel) return e.extra.channel.id == prev['extraID'];
  return true;
}

function embedEntry(entries) {
  let embed = new Discord.RichEmbed();
  let e = entries[0];

  embed.setAuthor(`${capsToNormal(e.action)} by ${e.executor.username}`, e.executor.avatarURL);
  let str = '';
  if (e.target != null) {
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
        str += `__${e.extra.count} Messages by__: \`${e.target.tag}\` in \`#${e.extra.channel.name}\`\n`;
        break;
      }
      str += `__TargetType__: \`${e.targetType}\`\n`;
    }
  } else {
    str += `__TargetType__: \`${e.targetType}\`\n`;
  }
  for (let i in entries) {
    let ent = entries[entries.length - 1 - i];
    if (ent.changes) {
      let title = ent.changes[0].key;
      let reason = '';
      if (ent.reason) reason = ` : ${ent.reason}`;
      let vars = {};
      switch (e.action) {
      case 'MEMBER_ROLE_UPDATE':
        title = title.replace('$', '');
        str += `・**${capsToNormal(title.toUpperCase())}**: \`${ent.changes[0].new[0].name}\`${reason}\n`;
        break;
      case 'ROLE_UPDATE':
        vars.flip = true;
      case 'CHANNEL_OVERWRITE_UPDATE':
        let perm = ent.changes[0].new ^ ent.changes[0].old;
        let perms = new Discord.Permissions(null, perm).serialize(false);
        let permKey = [];
        for (let name in perms) {
          if (perms[name]) permKey.push(name);
        }
        if ((perm & ent.changes[0].old) == 0) { // TODO this is fucked up. the order is opposite. LMAO
          if (vars.flip) {
            str += `・**Allow**: \`${permKey.join(', ')}\`\n`;
          } else {
            str += `・**${e.extra.name ? 'Deny' : capsToNormal(title.toUpperCase())}**: \`${permKey.join(', ')}\` for \`${e.extra.name ? e.extra.name : e.extra.user.tag}\`\n`;
          }
        } else {
          if (vars.flip) {
						  str += `・**Deny**: \`${permKey.join(', ')}\`\n`;
          } else {
						  str += `・**${e.extra.name ? 'Allow' : capsToNormal(title.toUpperCase())}**: \`${permKey.join(', ')}\` for \`${e.extra.name ? e.extra.name : e.extra.user.tag}\`\n`;
          }
        }
        break;
      case 'CHANNEL_CREATE':
      case 'EMOJI_CREATE':
        str += `・**${capsToNormal(title.toUpperCase())}**: \`${ent.changes[0].new}\`\n`;
        break;
      case 'CHANNEL_UPDATE':
      case 'EMOJI_UPDATE':
        str += `・**${capsToNormal(title.toUpperCase())}**: \`${ent.changes[0].old}\` to \`${ent.changes[0].new}\`\n`;
        break;
      case 'CHANNEL_DELETE':
      case 'EMOJI_DELETE':
        str += `・**${capsToNormal(title.toUpperCase())}**: \`${ent.changes[0].old}\`\n`;
        break;
      case 'ROLE_CREATE':
        title = e.changes[3].key;
        str += `・**${capsToNormal(title.toUpperCase())}**: ${ent.changes[3].new}\n`;
        break;
      case 'ROLE_DELETE':
        title = e.changes[3].key;
        str += `・**${capsToNormal(title.toUpperCase())}**: ${ent.changes[3].old}\n`;
        break;
      case 'CHANNEL_OVERWRITE_CREATE':
        title = e.changes[3].key;
        str += `・**${capsToNormal(title.toUpperCase())}**: <@${ent.changes[2].new}>\n`
        break;
      case 'CHANNEL_OVERWRITE_DELETE':
        str += `・**${capsToNormal(title.toUpperCase())}**: <@${ent.changes[2].old}>\n`;
        break;
      default:
        str += `・**${title}**: \`${JSON.stringify(ent.changes)}\`${reason}\n`;
        console.log(`Extra for ${e.action} = ${JSON.stringify(e.extra)}`);
      }
    }
  }
  switch (e.actionType) {
  case 'CREATE':
    embed.color = Number('0x87E966');
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
  for (let w of caps.split('_')) {
    w = w[0] + w.substr(1, w.length).toLowerCase();
    arr.push(w);
  }
  return arr.join('');
}

function normalToCaps(normal) {
  let str = normal[0];
  for (let i = 0; i < normal.length - 1; i++) {
    if (/[A-Z]/.test(normal[i + 1])) {
      str += '_';
    }
    str += normal[i + 1].toUpperCase();
  }
  return str;
}

module.exports.command = async (message, content, bot, server) => {
  try {
    let guild = server.guild;
    let loopCount = 0;
    let count = 0;
    let beforeID = null;
    let contents = content.split(' ');
    let user = null;
    if (message.mentions.users) user = message.mentions.users.first();
    let max = parseInt(contents[0]);
    if (!max || max > 20) max = 3;
    let type = null;
    let targID = null;
    for (let c of contents) {
      if (/\d{17,19}/.test(c)) {
        targID = c;
      }
      if (/[a-z]/g.test(c)) {
        c = normalToCaps(c);
      }
      if (Discord.GuildAuditLogs.Actions[c]) {
        if (!IgnoredActions[c])
          type = c;
      }
    }
    let prev = {'action': null, 'exeID': null, 'targetID': null, 'extraID': null, 'entries': []};
    while (loopCount < 20) { // dont go too much
      let params = {limit:100};
      if (beforeID) params.before = beforeID;
      if (user) params.user = user.id;
      if (type) params.type = type;
      let al = await guild.fetchAuditLogs(params);
      for (let e of al.entries.values()) {
        if (!isInteresting(e)) continue;
        if (sameEntry(e, prev)) {
          if (!e.changes) continue;
          prev['entries'].push(e);
          continue;
        }
        if (targID && e.target) {
          if (e.target.id && e.target.id != targID) continue;
        }
        let	preves = prev['entries'];
        prev['action'] = e.action;
        prev['exeID'] = e.executor.id;
        if (e.target == null) {
          prev['targetID'] = null;
        } else {
          prev['targetID'] = e.target.id;
        }
        if (e.extra) {
          if (e.extra.channel) {
            prev['extraID'] == e.extra.channel.id;
          } else {
            prev['extraID'] = null;
          }
        } else {
          prev['extraID'] = null;
        }
        prev['entries'] = [e];
        if (preves.length) {
          let embed = embedEntry(preves);
          await message.channel.send({embed});
          if (++count == max) {
            break;
          }
        }
      }
      if (count < max) {
        if (al.entries.size < 100) break;
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
