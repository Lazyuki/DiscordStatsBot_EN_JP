const Util = require('../classes/Util.js');
module.exports.name = 'unabn';

module.exports.isAllowed = (message, server) => {
  return (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.has('543721608506900480'));
};

module.exports.help = '`,unban <user ID> [reason]';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Please specify the user id');
    return;
  }

  let userID;
  const idMatch = content.match(Util.REGEX_RAW_ID);
  if (idMatch) {
    userID = idMatch[0];
  } else {
    message.channel.send('Invalid user ID');
    return;
  }
  const reason = content.replace(/(<@!?)?[0-9]{17,21}>?/, '').trim();
  try { 
    await server.guild.unban(userID, reason);
    message.channel.send(`✅ User <@${userID}> unbanned.`);
  } catch (e) {
    message.channel.send(`Unbanning ${userID} failed. Make sure the user ID is correct.`);
  }
}