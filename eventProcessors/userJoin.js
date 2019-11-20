module.exports.name = 'userJoin';
module.exports.events = ['JOIN'];
let EWBF = null;
let JHO = null;
let DDJLog = null;
const EJLX_BAN_EMOJI_ID = '423687199385452545';
const LOCKDOWN_ROLE_ID = '259181555803619329';
module.exports.initialize = async (json, server) => {
  server.newUsers = [];
  if (!json || !json['newUsers']) return;
  server.newUsers = json['newUsers'];
  if (server.guild.id == '189571157446492161') {
    server.invites = await server.guild.fetchInvites(); // Cleanup when saving...?
    EWBF = server.guild.channels.get('277384105245802497');
    JHO = server.guild.channels.get('189571157446492161');
  } else if (server.guild.id == '453115403829248010') {
    server.invites = await server.guild.fetchInvites(); // Cleanup when saving...?
    DDJLog = server.guild.channels.get('453125855523241984');
  }
};
module.exports.isAllowed = () => {
  return true;
};

const Discord = require('discord.js');
const EPOCH = 1420070400000;
const Long = require('long');

function generateSnowflake(date) {
  function pad(v, n, c = '0') {
    return String(v).length >= n ? String(v) : (String(c).repeat(n) + v).slice(-n);
  }
  let BINARY = `${pad((date.getTime() - EPOCH).toString(2), 42)}0000100000000000000000`;
  return Long.fromString(BINARY, 2).toString();
}

function generateDiffStr(diffMillis) {
  const absDiff = Math.abs(diffMillis);
  const [hr, min] = [Math.floor(absDiff / 3600000), Math.floor(absDiff / 60000) % 60];
  return `${hr ? `${hr} hr ` : ''}${min} mins`;
}

function joinNotif(member, inv) {
  let embed = new Discord.RichEmbed();
  embed.description = `📥 **${member.user.tag}** has \`joined\` the server. (${member.id})`;
  embed.setFooter(`User Join (${member.guild.memberCount})\nLink: ${inv[0]} from ${inv[1].inviter.username}`, member.user.avatarURL);
  embed.setTimestamp();
  embed.setColor(0x84a332);
  return embed;
}

async function sendLockdownNotif(member, inv, lockdown, welcome) {
  const embed = new Discord.RichEmbed();
  const date = Discord.SnowflakeUtil.deconstruct(member.id).date;
  let likelihood = 0;
  const diffNow = new Date() - date;
  const diffThen = lockdown.after ? new Date(lockdown.after) - date : null;
  const diffNowStr = generateDiffStr(diffNow);
  const regexp = lockdown.regex && new RegExp(lockdown.regex, lockdown.ignoreCase && 'i');
  if (diffNow < 600000) { // less than 10 minutes old
    likelihood += 4;
  } else if (diffNow < 86400000) { // less than a day old
    likelihood += 2;
  } else if (diffNow < 604800000) { // less than a week old
    likelihood++;
  }
  if (diffThen && diffThen < 0) likelihood += 2; // after the specified time
  if (lockdown.link && inv[0] === lockdown.link) likelihood++; // same link
  if (regexp && regexp.test(member.user.username)) likelihood += 3; // regex name
  const max = 4 + (lockdown.after ? 2 : 0) + (lockdown.link ? 1 : 0) + (lockdown.regex ? 3 : 0);

  const createdStr = `Account created **${diffNowStr} ago**${diffThen ? ` and **${generateDiffStr(diffThen)}** ${diffThen > 0 ? 'before' : 'after'} the specified time\n` : '\n'}`
  const linkStr = lockdown.link && inv[0] === lockdown.link ? `Used the same link \`${inv[0]}\` from ${inv[1].inviter.username}\n` : ''
  const regexStr = regexp && regexp.test(member.user.username) ? `Username matched the regex ${lockdown.regex}\n` : ''
  embed.title = 'Lockdown New User Alert'
  embed.description = `**${member.user.tag}** has \`joined\` the server. (${member.id}) ${member}\n\n${createdStr}${linkStr}${regexStr}Suspicious Level: ${likelihood}/${max}\n${likelihood !== 0 ? `Mods and **WP** can react with ✅ if you think this user is not suspicious, or <:ban:${EJLX_BAN_EMOJI_ID}> **twice** (triple click) to ban.` : ''}`;
  embed.setFooter(`User Join (${member.guild.memberCount})\nLink: ${inv[0]} from ${inv[1].inviter.username}`, member.user.avatarURL);
  embed.setTimestamp();
  embed.setColor(0x84a332);
  const banEmoji = member.guild.emojis.get(EJLX_BAN_EMOJI_ID);
  if (likelihood === 0) { // not suspicious
    await member.removeRole(LOCKDOWN_ROLE_ID);
    await JHO.send(welcome);
    await EWBF.send({ embed });
    return;
  } else if (likelihood === 10) {
    //await member.ban({ days: 1, reason: 'Lockdown Auto BAN. Matched all criteria.'});
    await EWBF.send(`Mock banned ${member}`);
    await EWBF.send({ embed });
    return;
  }
  const msg = await EWBF.send({ embed });

  await msg.react('✅');
  await msg.react(banEmoji);

  const filter = (reaction) => reaction.emoji.name === '✅' || (reaction.emoji.name === 'ban' && reaction.emoji.id === EJLX_BAN_EMOJI_ID);
  const banReacted = [];
  const collector = msg.createReactionCollector(filter, { time: 10 * 60 * 1000 }); // 10 minutes
  collector.on('collect', async (r, u) => {
    if (r.emoji.name === '✅') {
      await member.removeRole(LOCKDOWN_ROLE_ID);
      await JHO.send(welcome);
      collector.stop();
    } else {
      if (banReacted.includes(u.id)) {
        // await member.ban({ days: 1, reason: `Banned by ${u.username} during lockdown`});
        await EWBF.send(`Mock banned ${member}`);
        collector.stop();
      } else {
        banReacted.push(u.id);
      }
    } 
  });
  
  collector.on('end', () => {
    msg.reactions.removeAll();
  });  
}

async function postLogs(member, server) {
  const newInvites = await server.guild.fetchInvites();
  let inv = null;
  for (let [k, v] of newInvites) {
    let old = server.invites.get(k);
    if (old) {
      if (old.uses < v.uses) {
        inv = [k, v];
        break;
      }
    } else if (v.uses > 0) {
      inv = [k, v];
      break;
    }
  }
  server.invites = newInvites;
  if (inv === null) inv = ['japanese', { inviter: { username: 'vanityURL' } }];
  console.log(`${member.user.username} joined with ${inv[0]}`);
  if (inv[0] === 'NJJCYVD') {
    const date = Discord.SnowflakeUtil.deconstruct(member.id).date;
    const diff = date - new Date(server.lastmag);
    if (diff > 0) {
      const m = Math.floor(diff / (60 * 1000));
      const hr = Math.floor(m / 60);
      const min = m % 60;
      const avatarURL = member.user.avatarURL;
      if (avatarURL && avatarURL.includes('cdn.discordapp.com/avatars')) {
          const embed = new Discord.RichEmbed();
          embed.setTitle(`${member.user.tag} (${member.id}) might be magmikan aka リア充先輩 aka じぇい`)
          embed.setDescription(`Account created: ${hr} hrs ${min} mins after the last time magmikan was banned, and he has an avatar already`);
          embed.setFooter(`Account created: `, avatarURL);
          embed.setTimestamp(date);
          EWBF.send({ embed });
      }
    }
  }
  let welcome = `Welcome ${member} to the English-Japanese Language Exchange. Please read the rules first If you have any questions feel free to message one of the Mods!  Tell us what your native language is and we'll get you properly tagged with a colored name.\n\n`;
  welcome += `${member}さん、ようこそEnglish-Japanese Language Exchangeへ!\nあなたの母語を教えてください!\n質問があれば、何でも遠慮なく聞いてくださいね。このチャンネルには日本語と英語で投稿できます。よろしくお願いします！ <@&357449148405907456>`;

  if (server.lockdown) {
    await member.addRole(LOCKDOWN_ROLE_ID);
    await sendLockdownNotif(member, inv, server.lockdown, welcome);
    return;
  } else if (member.guild.members.get('270366726737231884').presence.status == 'offline') { // rybot
    let embed = joinNotif(member, inv);
    EWBF.send({ embed });
  } else {
    setTimeout(async () => {
      let joinedSnowflake = generateSnowflake(member.joinedAt);
      let msgs = await EWBF.fetchMessages({limit: 20, after: joinedSnowflake});
      for (let [, msg] of msgs) {
        if (msg.author.id == '270366726737231884' && msg.embeds.length && msg.embeds[0].description.includes(member.id)) {
          return;
        }
      }
      let embed = joinNotif(member, inv);
      EWBF.send({embed});
    }, 5000);
  }
  
  if (member.guild.members.get('159985870458322944').presence.status == 'offline') { // mee6
    JHO.send(welcome);
  } else {
    setTimeout(async () => {
      let msgs = await JHO.fetchMessages({limit: 50});
      for (let [, msg] of msgs) {
        if (msg.author.id == '159985870458322944' && msg.mentions.members.has(member.id)) {
          return;
        }
      }
      JHO.send(welcome);
    }, 5000);
  }
}

async function postLogsDDJ(member, server) {
  let newInvites = await server.guild.fetchInvites();
  let inv = null;
  for (let [k, v] of newInvites) {
    let old = server.invites.get(k);
    if (old) {
      if (old.uses < v.uses) {
        inv = [k, v];
        break;
      }
    } else if (v.uses > 0) {
      inv = [k, v];
      break;
    }
  }
  server.invites = newInvites;
  let embed = joinNotif(member, inv);
  DDJLog.send({embed});
}
module.exports.process = async (member, server) => {
  if (server.newUsers.unshift(member.id) > 3) server.newUsers.pop();
  if (member.guild.id == '189571157446492161') 
    setTimeout(() => postLogs(member, server), 500);
  if (member.guild.id == '453115403829248010')
    setTimeout(() => postLogsDDJ(member, server), 500);
};
