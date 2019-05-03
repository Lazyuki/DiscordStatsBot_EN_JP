const Discord = require('discord.js');
const dateFormat = require('dateformat');
const Util = require('../classes/Util.js');

module.exports.name = 'snowflake';

module.exports.alias = [
  'id',
  'sf',
  'snowflake'
];

module.exports.isAllowed = () => {
  return true;
};

module.exports.help = 'Shows the Discord ID for an object and the creation time. `,id <@mention, #channel, ID, or username>`';

module.exports.command = async (message, content, bot, server) => {
  if (content == '') {
    message.channel.send('Give me either `@mention`, `#channel`, `valid snowflake ID`, or the user\'s name');
    return;
  }
  //TODO: roles
  let chan = message.channel;
  let mentions = message.mentions;
  let chans = mentions.channels;
  let users = mentions.users;
  let chanMention = chans.size > 0;
  let userMention = users.size > 0;

  if (chanMention) {
    for (var c of chans.keys()) {
      let date = Discord.SnowflakeUtil.deconstruct(c).date;
      let embed = new Discord.MessageEmbed();
      let dateStr = dateFormat(date, 'UTC:ddd mmm dS, yyyy \'at\' h:MM TT');
      embed.title = 'Creation time in UTC and your local time';
      embed.description = `Snowflake ID: ${c} (<#${c}>)\nUnix Time in milliseconds: ${date.getTime()}`;
      embed.setFooter(`UTC | ${dateStr } --- Local`);
      embed.color = Number('0x3A8EDB');
      embed.timestamp = date;
      chan.send(c, {embed});
    }
  }
  if (userMention) {
    for (var u of users.keys()) {
      let date = Discord.SnowflakeUtil.deconstruct(u).date;
      let embed = new Discord.MessageEmbed();
      let dateStr = dateFormat(date, 'UTC:ddd mmm dS, yyyy \'at\' h:MM TT');
      embed.title = 'Creation time in UTC and your local time';
      embed.setAuthor(users.get(u).tag, users.get(u).avatarURL);
      embed.description = 'Snowflake ID: ' + u + ` (<@${u}>)\nUnix Time in milliseconds: ${date.getTime()}`;
      embed.setFooter(`UTC | ${dateStr } --- Local`);
      embed.color = Number('0x3A8EDB');
      embed.timestamp = date;
      chan.send(u, {embed});
    }
  }
  if (!chanMention && !userMention) {
    let embed = new Discord.MessageEmbed();
    let def = '1420070400000';
    let id = content;
    let date = Discord.SnowflakeUtil.deconstruct(content).date;
    let u = await Util.searchUser(message, content, server, bot);
    if (u) {
      date = Discord.SnowflakeUtil.deconstruct(u.id).date;
      embed.setAuthor(u.tag, u.avatarURL);
      id = u.id;
    } else {
      if (date.getTime() == def) {
        message.react('❓');
        return;
      }
    }
    let dateStr = dateFormat(date, 'UTC:ddd mmm dS, yyyy \'at\' h:MM TT');
    embed.title = 'Creation time in UTC and your local time';
    embed.description = `Snowflake ID: ${id}\nUnix Time in milliseconds: ${date.getTime()}`;
    embed.setFooter(`UTC | ${dateStr } --- Local`);
    embed.color = Number('0x3A8EDB');
    embed.timestamp = date;
    chan.send(id, {embed});
  }
};
