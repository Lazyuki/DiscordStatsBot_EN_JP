const Discord = require('discord.js');

module.exports.name = 'noFilterOnly';
module.exports.alias = ['nofilter', 'cooloffyaheads', 'nf', 'st'];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return (
    message.member.hasPermission('MANAGE_ROLES') &&
    message.member.hasPermission('MUTE_MEMBERS')
  );
};
const nofilterOnlyRole = '378668720417013760';
const nofilterRole = '196106229813215234';
const nofilterChan = '193966083886153729';
const nofilterVoice = '196684007402897408';
const nofilterVoiceText = '390796551796293633';

function remove(members) {
  for (var mem of members) {
    mem.removeRole(nofilterOnlyRole);
  }
}

module.exports.help =
  '`,st @someone @sometwo... [minutes (default = 5)]` Sends people to ~~oblivion~~ <#193966083886153729> for some minutes. ***__YOU SHOULD WARN THEM FIRST.__***';

const Util = require('../classes/Util.js');

module.exports.command = async (message, content, bot, server) => {
  let mentions = message.mentions.members;
  if (mentions.size == 0) {
    message.channel.send('You have to mention them!');
    return;
  }
  content = content.replace(Util.REGEX_USER, '');
  let min = parseInt(content);
  if (isNaN(min)) {
    min = 5;
  } else if (min > 1000) {
    min = 1000;
  }
  let nofilter = server.guild.channels.get(nofilterChan);
  let members = mentions.values();
  var names = '';
  let forlater = [];
  for (var mem of members) {
    mem.addRole(nofilterOnlyRole);
    mem.addRole(nofilterRole);
    if (mem.voiceChannel) {
      nofilter = server.guild.channels.get(nofilterVoiceText);
      mem.setVoiceChannel(nofilterVoice);
    }
    forlater.push(mem);
    names += mem.toString() + ' ';
    const warning = {
      issued: message.createdTimestamp,
      issuer: message.author.id,
      link: message.url,
      warnMessage: `Sent to <#${nofilterChan}>`,
    };
    if (server.warnlist[mem.id]) {
      server.warnlist[mem.id].push(warning);
    } else {
      server.warnlist[mem.id] = [warning];
    }
  }
  nofilter.send(
    `${names}you have been muted in all channels but here for ${min} minutes.`
  );
  message.channel.send(`Sent to ${nofilter}`);
  const agt = server.guild.channels.get('755269708579733626');
  let embed = new Discord.RichEmbed();
  embed.setAuthor(
    `No filtered by ${message.author.tag}`,
    message.author.avatarURL
  );
  embed.description = `${names}`;
  embed.color = Number('0xEC891D');
  embed.setFooter(`In: #${message.channel.name}`);
  embed.timestamp = new Date();
  agt.send({ embed });

  setTimeout(() => {
    remove(forlater);
  }, min * 60 * 1000);
};
