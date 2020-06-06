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

const tempList = '664936721645043723,666398861845069825,680551698011521107,680557358467776625,680559382290759728,680879560610545694,680881470356848940,680891530537467997,680892168365146213,680902020273930280,680906546552897556,680914336243515435,680920363219026166,680926190747648029,680931852558925845,681203865131024515,681217993727803429,681218045359685655,681218522495320085,681224653779632207,681230640770842674,681240047223439432,681250083400056852,681260906193223850,682625273589399558,683025438267932686,683048862214258715,683054801633935419,683061408816300062,683062853091065869,683080878296924161,683124895273844752,683298449524916249,683365821908648076,683367888672784415,683375491326935042,683375876020502583,683376345556058174,683378103736729648,683379768300666908,683382231972184259,683388942321451022,683396138715578372,683820991562121286,683823821152845825,683862134332981269,683894487843602435,683960489193373751,684012462605074499,684025722586529858,684120586083237958,684126052980883578,684146781054828564,684297115123712112,684324466892865537,684534403225223230,684534546187943990,684561835307171842,684575639373873269,684580931499065403,684591207224967199,684592612216406091,684607862458417217,684620252348547101,684646181795659810,684649182493278243,684666105058557959,684668157528506396,684673487930916875,684686859183456302,684689716574158848,686324872078688283,686327003712192531,686327347343130630,686328457474343155,686330037817049240,686401039280242764,686402497400668202,686402575469510679,686848582153666585,687033833240920238,687061820535734314,687062599518519349,687063374554857523,687065022165549110,687065289413623818,687072793090588711,687078182142214247,687079018172121131,687088449248821264,687092262777520191,687097121526120516,687102397306503280,687113431546986537,687113895369768968,687131094864494720,687160186309312640,687168566901997578,687216852497465356,687237722037026817,687280748092325906,687343028784070713,687345150544052284,687355813576310804,687363365835636806,687365131574968373,687367734471950383,687369827459006465,687370813501997155,687371365837307938,687372351029116939,687372556290097182,687373930343694440,687373983787778090,687591353634521112,687592354961817610,687599212438880267,687614254433435658,687631683033497630,687673854730305621,687706140468838411,687708943585247303,687710189528416261,687719049383247904,687723441943609378,687725090703671298,687726887719534684,687727528374304777,687729355895734293,687732351136301080,687737549321797664,687747039320473623,687749050119880727,687752330153820207,687757142643834935,687759145734111297,687769022288494805,687769173614526471,687779358206853138,687784589720420461,687806748337504269,687810824080719898,687836076303319116,687840941976977488,687858404194385931,687877800539324416,688055702492807169,688056189468278794,688060503548756043,688065679815082051,688068704105267203,688073756588900467,688081559063887898,688097139901202453,688099979784356022,688100147795722303,688109684888043520,688111850134831214,688114038219079800,688115974490161211,688117574239649925,688118381903216691,688119332236034279,688119855475589149,688121631608143878,688121689175097360,688123102168743957,688123231240323134,688126044632514574,688126291828015135,688127101207183428,688130113245937829,688130662888243352,688132317696491584,688132617962651913,688132868542562409,688134119288340526,688134412147097614,688134741329051675,688134939543208034,688136170135093345,688136714245636224,688137258142007355,688137645494108221,688138166233858056,688139892705722470,688140368767746146,688140949053767729,688141056805830708,688143853538115646,688144158052843551,688146009351520325,688146624173965319,688151738108084257,688152734393696401,688153832869331021,688154855520469027,688157119991644190,688158719741394959,688161249816608769,688161999519219722,688173430746775567,688204160444792920,68821158354092036,688266518647406672,689840386427977766,689873782311223389,690327921923326064,690357949084074024,690377719409803294,87000837951348736'.split(',');


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

async function bparker(member, inv) {
  const date = Discord.SnowflakeUtil.deconstruct(member.id).date;
  const username = member.user.username;
  let likelihood = 0;
  const diffNow = new Date() - date;
  if (diffNow < 600000) { // less than 10 minutes old
    likelihood += 4;
  }
  if (inv[0] === 'japanese') likelihood++; // jp link
  if ((username.includes('Lexy') && username.includes('Maria')) || username === 'OaklandRaiders') likelihood += 5;
  if (likelihood === 10) {
    await member.ban({ days: 1, reason: 'Auto BAN bparker'});
    setTimeout(async () => {
      let msgs = await JHO.fetchMessages({limit: 30});
      for (let [, msg] of msgs) {
        if (msg.author.id == '159985870458322944' && msg.mentions.users.has(member.id)) { // delete mee6 welcome
          msg.delete();
        }
        if (msg.author.id === '270366726737231884' && msg.content.includes(`Welcome ${username}`)) { // delete Rai welcome
          msg.delete();
        }
      }
    }, 3000);
    return true;
  }
  return false;
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

  const createdStr = `Account created **${diffNowStr}** ago${diffThen ? ` and **${generateDiffStr(diffThen)}** ${diffThen > 0 ? 'before' : 'after'} the specified time\n` : '\n'}`;
  const linkStr = lockdown.link && inv[0] === lockdown.link ? `Used the same link \`${inv[0]}\` from ${inv[1].inviter.username}\n` : '';
  const regexStr = regexp && regexp.test(member.user.username) ? `Username matched the regex: \`${lockdown.regex}\`\n` : '';
  embed.title = 'New User Alert';
  embed.description = `**${member.user.tag}** has \`joined\` the server. (${member.id}) ${member}\n\n${createdStr}${linkStr}${regexStr}Suspicious Level: **${likelihood}**/${max}\n${likelihood !== 0 && likelihood !== 10 ? `\nMods and **WP** can react with ✅ if you think this user is not suspicious, or <:ban:${EJLX_BAN_EMOJI_ID}> **twice** (triple click) to ban.` : ''}`;
  embed.setFooter(`User Join (${member.guild.memberCount})\nLink: ${inv[0]} from ${inv[1].inviter.username}`, member.user.avatarURL);
  embed.setTimestamp();
  embed.setColor(0x84a332);
  const banEmoji = member.guild.emojis.get(EJLX_BAN_EMOJI_ID);
  if (likelihood <= 3) { // not suspicious
    welcome && await member.removeRole(LOCKDOWN_ROLE_ID);
    welcome && await JHO.send(welcome);
    return;
  } else if (likelihood === 10 && welcome) {
    await member.ban({ days: 1, reason: 'Auto BAN. Matched all criteria.'});
    await EWBF.send({ embed });
    return;
  }
  const msg = await EWBF.send({ embed });

  await msg.react('✅');
  await msg.react(banEmoji);

  const filter = (reaction) => reaction.emoji.name === '✅' || (reaction.emoji.name === 'ban' && reaction.emoji.id === EJLX_BAN_EMOJI_ID);
  const banReacted = new Set();
  const collector = msg.createReactionCollector(filter, { time: 10 * 60 * 1000 }); // 10 minutes
  collector.on('collect', async (r) => {
    if (r.emoji.name === '✅') {
      welcome && await member.removeRole(LOCKDOWN_ROLE_ID);
      welcome && await JHO.send(welcome);
      collector.stop();
    } else {
      if (banReacted.has(r.users.lastKey())) {
        await member.ban({ days: 1, reason: `Banned by ${r.users.last()} during lockdown`});
        collector.stop();
      } else {
        r.users.forEach((user, userID) => banReacted.add(userID));
      }
    } 
  });
  
  collector.on('end', () => {
    msg.clearReactions();
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

  if (await bparker(member, inv)) return;

  let welcome = `Welcome ${member}. Please read <#267275565617250312> and tell us what your native language is!\n${member}さん、ようこそ! あなたの母語を教えてください! 注意事項は<#267275565617250312>に書いてあります。<@&357449148405907456>`;

  if (server.lockdown) {
    await member.addRole(LOCKDOWN_ROLE_ID);
    await sendLockdownNotif(member, inv, server.lockdown, welcome);
    return;
  } else if (server.quickban) {
    await sendLockdownNotif(member, inv, server.quickban, null);
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
          if (tempList.includes(member.id)) { // delete raider's welcome message
            await msg.delete();
          }
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
  if (tempList.includes(member.id)) {
    await member.ban({ days: 1, reason: 'raid'});
  }
  if (member.guild.id == '189571157446492161') 
    setTimeout(() => postLogs(member, server), 500);
  if (member.guild.id == '453115403829248010')
    setTimeout(() => postLogsDDJ(member, server), 500);
};
