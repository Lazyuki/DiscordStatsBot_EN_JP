module.exports.name = 'fe';
module.exports.alias = [
  'fe'
];
module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;
  return true;
};

module.exports.help = '`,fe` explanation of fe';


module.exports.command = async (message) => {
  message.channel.send("People with a 'Fluent' tag must have a near-native level of English, because what they write is an exemplar of what perfect English looks like. It's important that we set a good example for English learners, which is why it takes some time for people to receive their 'Fluent English' tag! We hope you understand.");
  message.delete();
};
