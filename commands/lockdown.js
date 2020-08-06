module.exports.name = 'lockdown';

module.exports.alias = [
  'lockdown'
];
module.exports.initialize = (json, server) => {
  server.lockdown = null;
  if (!json || !json['lockdown']) return;
  server.lockdown = json['lockdown'];
};

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;  
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '__Mods Only__ Enable lockdown with options. New users will automatically be muted. `,lockdown [-t discord_id ]  [ -l invite_link ] [-r username_regex ] [ -i (ignore case?) ]`\nDiscord ID is to check whether or not the account is created after that ID. Use raw invite link like "japanese" or "VMNnyEk". Regex is JS regex.\ne.g. `,lockdown -t 646129675202199582 -l japanese -r ^bannable_name -i`';

const Discord = require('discord.js');


module.exports.command = async (message, content, bot, server) => {
  let timestamp_id = /-t (\d+)/.exec(content);
  if (timestamp_id) {
    timestamp_id = timestamp_id[1];
  } else {
    timestamp_id = null;
  }
  let link = /-l (\S+)/.exec(content);
  if (link) {
    link = link[1];
  } else {
    link = null;
  }
  let regex = /-r (\S+)/.exec(content);
  let ignoreCase = /\s-i/.exec(content) ? true : undefined;
  if (regex) {
    regex = regex[1];
  } else {
    regex = null;
  }
  
  let lockdown = !timestamp_id && !link && !regex ? null : { link, regex, ignoreCase };
  if (timestamp_id) {
    lockdown.after = Discord.SnowflakeUtil.deconstruct(timestamp_id).date.getTime();
  }
  const JHO = server.guild.channels.get('189571157446492161');

  if (lockdown === null) {
    if (server.lockdown) {
      message.channel.send('Use `,unlockdown` to end the lockdown');
    } else {
      message.channel.send('You need to specify some parameters');
    }
    return;
  }
  server.lockdown = lockdown;

  // Mute Mee6 and Rai
  try {
    await JHO.overwritePermissions('159985870458322944', { SEND_MESSAGES: false }); // Mee6
    await JHO.overwritePermissions('270366726737231884', { SEND_MESSAGES: false }); // Rai
  } catch (e) {
    console.error(e);
    message.channel.send('Failed to overwrite permissions for MEE6 and Rai in JHO');
    return;
  }
  
  message.channel.send(`✅ Server is now under lockdown. Mee6 and Rai have been muted in JHO. (Time ID: ${lockdown.after}, Link: ${lockdown.link}, RegEx: /${lockdown.regex}/${ignoreCase ? 'i' : ''})`);
};
