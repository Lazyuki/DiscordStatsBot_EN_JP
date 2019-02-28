const Util = require('../classes/Util.js');
module.exports.name = 'tag';
module.exports.alias = [
  'tag',
  't'
];

// Initialized in ../eventProcessors/userJoin.js

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};

module.exports.help = '__WP Only__ See the pin in <#277384105245802497>\n`,t < nj | fj | ne | fe | ol >... [ @mention, 1, 2, 3, id, -n ] `\n`,t en -n` Matches the most recent new user in this channel';

const LANG_ROLES = [
  { abbrev: 'nj', name: 'Native Japanese', id: '196765998706196480' },
  { abbrev: 'jp', name: 'Native Japanese', id: '196765998706196480' },
  { abbrev: 'fj', name: 'Fluent Japanese', id: '270391106955509770' },
  { abbrev: 'ne', name: 'Native English', id: '197100137665921024' },
  { abbrev: 'en', name: 'Native English', id: '197100137665921024' },
  { abbrev: 'fe', name: 'Fluent English', id: '241997079168155649' },
  { abbrev: 'ol', name: 'Other Language', id: '248982130246418433' },
  { abbrev: 'nu', name: 'New User', id: '249695630606336000'},
];

const roleRegex = new RegExp(`\\b(${LANG_ROLES.map(r => r.abbrev).join('|')})\\b`, 'gi');
const roleIDs = LANG_ROLES.map(r => r.id);

function getRole(key, value) {
  return LANG_ROLES.find(r => r[key] === value);
}

function joinEnglish(list) {
  if (list.length <= 2) {
    return list.join(' and ');
  } else {
    list[list.length - 1] = 'and ' + list[list.length - 1];
    return list.join(', ');
  }
}

const numRegex = /\b([123])\b/;
const searchRegex = /(^|\s)-n\b/;

module.exports.command = async (message, content, bot, server) => {
  const roles = content.match(roleRegex);
  if (!roles) return; // no such role
  content = content.replace(roleRegex, '').trim();

  let targetID;
  let targetMember;

  const isSearch = content.match(searchRegex);
  if (isSearch) {
    const log = await message.channel.messages.fetch();
    const nuID = getRole('abbrev', 'nu').id;

    for (let msg of log) {
      const mem = msg.member;
      if (mem && mem.roles.has(nuID)) {
        targetMember = mem;
      }
    }
    if (!targetMember) {
      message.channel.send('Failed to find a new user in this channel');
      return;
    }
  } else if (content) {
    const numMatch = content.match(numRegex);
    const idMatch = content.match(Util.REGEX_RAW_ID);
    if (message.mentions.members.size) {
      targetMember = message.mentions.members.first();
    } else if (idMatch) {
      targetID = idMatch[0];
    } else if (numMatch) {
      const num = numMatch[0];
      targetID = server.newUsers[parseInt(num) - 1];
    } else {
      message.react('❓');
      return;
    }
  } else {
    targetID = server.newUsers[0];
  }

  if (!targetMember) {
    targetMember = await server.guild.member(targetID);
    if (!targetMember) {
      message.channel.send('Member not found');
      return;
    }
  }

  message.delete({timeout: 200});

  const oldRoles = targetMember.roles.filter(r => roleIDs.includes(r.id)).map(r => getRole('id', r.id));
  const newRoles = roles.map(r => getRole('abbrev', r));
  const oldNames = new Set(oldRoles.map(r => r.name));
  const newNames = new Set(newRoles.map(r => r.name));

  let alreadyTagged = false;
  if (oldNames.size === newNames.size) {
    alreadyTagged = true;
    for (let o of oldNames) if (!newNames.has(o)) alreadyTagged = false;
  }

  if (alreadyTagged) {
    (await message.channel.send(`Already tagged as ${joinEnglish([...oldNames].map(n => `\`${n}\``))}`)).delete({timeout: 5000});
    return;
  }

  for (let r of oldRoles) {
    if (!newNames.has(r.name)) {
      await targetMember.roles.remove(r.id);
    }
  }
  for (let r of newRoles) {
    if (!oldNames.has(r.name)) {
      await targetMember.roles.add(r.id, `by ${message.author.tag}`);
    }
  }

  if (oldNames.size === 1 && oldNames.has('New User')) {
    message.channel.send(`${targetMember.user.username}, you've been tagged as ${joinEnglish([...newNames].map(n => `\`${n}\``))} by **${message.author.username}**!`);
  } else {
    message.channel.send(`${targetMember.user.username}, you've been tagged as ${joinEnglish([...newNames].map(n => `\`${n}\``))} instead of ${joinEnglish([...oldNames].map(n => `\`${n}\``))} by **${message.author.username}**!`);
  }
};
