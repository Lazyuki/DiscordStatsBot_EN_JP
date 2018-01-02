
module.exports.name = 'noFilterOnly';
module.exports.alias = [
  'nofilter',
  'cooloffyaheads',
  'nf'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return message.member.hasPermission('MANAGE_ROLES');
};
const nofilterOnlyRole = '378668720417013760';
const nofilterRole = '196106229813215234';
const nofilterChan = '193966083886153729';
const nofilterVoice = '196684007402897408';

function remove(members) {
  for (var mem of members) {
    mem.removeRole(nofilterOnlyRole);
  }
}

module.exports.help = '*WP only* `,nf @someone @sometwo @somethree` Sends people to ~~oblivion~~ <#193966083886153729> for 5 minutes. ***__YOU SHOULD WARN THEM FIRST.__*** Only meant to be used as a last resort.';

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('MANAGE_ROLES')) return;
  let mentions = message.mentions.members;
  if (mentions.size == 0) {
    message.channel.send('You have to mention them!');
    return;
  }
  let members = mentions.values();
  var names = '';
  let forlater = [];
  for (var mem of members) {
    mem.addRole(nofilterOnlyRole);
    mem.addRole(nofilterRole);
    mem.setVoiceChannel(nofilterVoice);
    forlater.push(mem);
    names += mem + ' ';
  }
  let nofilter = server.guild.channels.get(nofilterChan);
  nofilter.send(names + 'you have been muted in all channels but here for 5 minutes.');
  message.channel.send(`Sent to <#${nofilterChan}>`);

  setTimeout(() => {
    remove(forlater);
  }, 5*60*1000);
};
