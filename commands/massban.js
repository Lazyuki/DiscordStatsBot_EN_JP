module.exports.name = 'massban';

module.exports.alias = [
  'massban',
  'banraid',
  'raidban',
];

module.exports.isAllowed = (message, server) => {
  return (message.member.hasPermission('BAN_MEMBERS') || message.member.roles.has('543721608506900480'));
};

module.exports.help = '__Mods Only__ `,massban <user> [--end user] [--except user mentions]`\n Ban all the users joined after the mentioned guy. Can also specify the last guy with `--end`. ALL INCLUSIVE. \nExamples:\n`,massban @NewGuy`\n`,massban @FirstGuy --end @LastGuy --except @InnocentGuy` will ban @FirstGuy and anyone after that up to and including @LastGuy, except @InnocentGuy';

const Discord = require('discord.js');

module.exports.command = async (message, content, bot, server) => {
  const badPeople = [];
  const executor = message.author;
  let deleteDays = 1;
  const reason = 'Mass Ban';
  let endID = null;
  const endFlag = content.match(/--end\s+([0-9]{17,21})/);
  if (endFlag) {
    content = content.replace(/--end\s+[0-9]{17,21}/, '');
    endID = endFlag[1];
  }
  let [first, exceptions] = content.split('--except');
  const exceptionIDs = exceptions ? exceptions.match(/[0-9]{17,21}/g) : [];
  const firstMatch = first ? first.match(/[0-9]{17,21}/) : null;
  const firstID = firstMatch && firstMatch[0];

  if (!firstID) {
    message.channel.send('Failed to resolve the first user');
    return;
  }
  const firstMem = server.guild.member(firstID);
  let firstMillis;
  if (firstMem && firstMem.joinedAt) {
    firstMillis = firstMem.joinedAt.getTime();
  } else {
    const date = Discord.SnowflakeUtil.deconstruct(firstID).date;
    firstMillis = date.getTime();
  }
  const endMem = endID ? server.guild.member(endID) : null;

  const nowMillis = new Date().getTime();
  if (nowMillis - firstMillis > 86400000) {
    message.channel.send('The first user join date cannot be older than 1 day');
    return;
  }
  let endMillis = nowMillis;
  if (endMem && endMem.joinedAt) endMillis = endMem.joinedAt.getTime();
  if (endMillis - firstMillis < 0) {
    message.channel.send('The last guy joined before the first guy');
    return;
  }

  server.guild.members.forEach((mem, memID) => {
    if (!mem.joinedAt) return;
    const memMillis = mem.joinedAt.getTime();
    if (memMillis >= firstMillis && memMillis <= endMillis && !exceptionIDs.includes(memID)) {
      badPeople.push(mem);
    }
  });

  if (badPeople.length === 0) {
    message.channel.send('Failed to get members...');
    return;
  }

  const banMessage = `<:hypergeralthinkban:443803651325034507>  **You are banning ${badPeople.length} people!**  <:hypergeralthinkban:443803651325034507>\n\n${badPeople.map(m => m.toString()).join('\n')}\n\nType \`confirm\` or \`cancel\``;
  await message.channel.send(banMessage, { split: true });
  const filter = m => m.member.id == executor.id;
  const collector = message.channel.createMessageCollector(filter, { time: 45000 });
  collector.on('collect', m => {
    if (m.content.toLowerCase() === 'confirm' || m.content.toLowerCase() === 'confirm keep') {
      if (m.content.toLowerCase() === 'confirm keep') {
        deleteDays = 0;
      }
      badPeople.forEach(async mem => {
        try {
          await mem.ban({ days: deleteDays, reason: `Issued by: ${executor.tag}. Reason: ${reason}` });
        } catch (e) {
          await message.channel.send(`Failed to ban: ${mem}`);
        }
      });
      collector.stop('Banned');
      return;
    }
    if (m.content.toLowerCase() == 'cancel') {
      collector.stop('Cancelled');
      return;
    }
    message.channel.send('Invalid response. Type `confirm` or `cancel`');
  });
  collector.on('end', (collected, endReason) => {
    if (endReason == 'Banned') {
      message.channel.send(`✅ Banned ${badPeople.length} people`);
      return;
    } else if (endReason == 'Cancelled') {
      message.channel.send('❌ Cancelled');
      return;
    } else {
      message.channel.send('❌ Failed to confirm');
      return;
    }
  });
};
