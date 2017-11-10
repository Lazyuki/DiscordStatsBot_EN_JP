const nofilterOnlyRole = '378668720417013760';
const nofilterROle = '196106229813215234';
const nofilterChan = '193966083886153729';

module.exports.alias = [
	'nofilter',
	'cooloffyaheads',
  'nf'
];

function remove(members) {
  for (var mem of members) {
    mem.removeRole(nofilterOnlyRole);
  }
}

module.exports.command = async (message, content, bot, server) => {
  if (!message.member.hasPermission('MANAGE_ROLES')) return;
  let mentions = message.mentions.members;
  if (mentions.size == 0) {
    message.channel.send('You have to mention them!');
    return;
  }
  let members = mentions.values();
  var names = '';
  for (var mem of members) {
    mem.addRole(nofilterOnlyRole);
    mem.addRole(nofilterRole);
    names += mem + ' ';
  }
  let nofilter = server.guild.channels.get(nofilterChan);
  nofilter.send(names + 'you have been muted in all channels but here for 5 minutes.');

  setTimeout(() => {
    remove(members);
  }, 5*60*1000);
};
