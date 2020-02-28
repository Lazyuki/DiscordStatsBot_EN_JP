module.exports.name = 'quickban';

module.exports.alias = [
  'quickban',
  'trollbegone'
];
module.exports.initialize = (json, server) => {
  server.quickban = null;
  if (!json || !json['quickban']) return;
  server.lockdown = json['quickban'];
};

module.exports.isAllowed = (message, server) => {
  if (server.guild.id != '189571157446492161') return false;  
  return message.member.hasPermission('ADMINISTRATOR');
};

module.exports.help = '__Mods Only__ Enable quick ban with options.  `,quickban [-t discord_id ]  [ -l invite_link ] [-r username_regex ] [ -i (ignore case?) ]`\nDiscord ID is to check whether or not the account is created after that ID. Use raw invite link like "japanese" or "VMNnyEk". Regex is JS regex.\ne.g. `,quickban -t 646129675202199582 -l japanese -r ^bannable_name -i`';

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
  
  let quickban = !timestamp_id && !link && !regex ? null : { link, regex, ignoreCase };
  if (timestamp_id) {
    quickban.after = Discord.SnowflakeUtil.deconstruct(timestamp_id).date.getTime();
  }
  server.quickban = quickban;
  
  message.channel.send(`✅ Quck ban settings applied. (Time ID: ${quickban.after}, Link: ${quickban.link}, RegEx: /${quickban.regex}/${ignoreCase ? 'i' : ''})`);
};
