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
  let ignoreCase = /\s-i/.exec(content);
  if (regex) {
    regex = new RegExp(regex[1], ignoreCase ? 'i' : undefined);
  } else {
    regex = null;
  }
  
  let lockdown = !timestamp_id && !link && !regex ? null : { link, regex };
  if (timestamp_id) {
    lockdown.after = Discord.SnowflakeUtil.deconstruct(timestamp_id).date.getTime();
  }
  server.lockdown = lockdown;

  // Mute Mee6 and Rai
  const JHO = server.guild.channels.get('189571157446492161');
  JHO.overwritePermissions('159985870458322944', { SEND_MESSAGES: false }); // Mee6
  JHO.overwritePermissions('270366726737231884', { SEND_MESSAGES: false }); // Rai

  
  message.channel.send('✅ Server is now under lockdown. Mee6 and Rai have been muted in JHO.');
};
