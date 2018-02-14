module.exports.name = 'currentVC';

module.exports.alias = [
  'cvc'
];

module.exports.isAllowed = (message, server, bot) => {
  if (message.guild.id != '293787390710120449') return false;  // My server  
  return message.author.id == bot.owner_ID;
};

module.exports.help = 'Save the server state.';

module.exports.command = async (message, _, bot, server) => {
  for (var v in server.tempvc) {
    let t = server.tempvc[v];
    let member = await server.guild.fetchMember(v);
    console.log(`${member.user.username}: ${Math.round((t - new Date().getTime()) / 60000)} min`);
  }
};
