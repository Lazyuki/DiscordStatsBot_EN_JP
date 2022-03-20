import { BotCommand } from '@/types';

const hide: BotCommand = {
  name: 'hide',
  isAllowed: 'ADMIN',
  onCommandInit: (server) => {
    server.config.hiddenChannels ||= [];
  },
  description:
    'Hide a channel from statistics commands, unless invoked in one of the hidden channels. Useful for keeping mod channels hidden',
  arguments: '<#channel> [#channel2 ... ]',
  childCommands: ['hidden', 'unhide'],
  normalCommand: async ({ content, message, server }) => {
    const chan = server.guild.channels.cache.get(content);
    if (chan) {
      if (server.config.hiddenChannels.includes(chan.id)) return;
      server.config.hiddenChannels.push(chan.id);
      await message.channel.send(`<#${chan.id}> is hidden now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        if (server.config.hiddenChannels.includes(id)) return;
        server.config.hiddenChannels.push(id);
        await message.channel.send(`<#${ch.id}> is hidden now.`);
      }
    }
  },
};

const hidden: BotCommand = {
  name: 'hidden',
  isAllowed: 'ADMIN',
  description: 'Show hidden channels',
  parentCommand: 'hide',
  normalCommand: async ({ message, server }) => {
    const channels = server.config.hiddenChannels;
    let s = '';
    for (const channelId of channels) {
      s += `<#${channelId}>\n`;
    }
    await message.channel.send(s);
  },
};

const unhide: BotCommand = {
  name: 'unhide',
  isAllowed: 'ADMIN',
  description: 'Un-hide channels',
  parentCommand: 'hide',
  normalCommand: async ({ message, server, content }) => {
    const chan = server.guild.channels.cache.get(content);
    if (chan) {
      const index = server.config.hiddenChannels.indexOf(chan.id);
      if (index === -1) {
        await message.channel.send(`<#${chan.id}> was not hidden.`);
        return;
      }
      server.config.hiddenChannels.splice(index, 1);
      message.channel.send(`<#${chan.id}> is un-hidden now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        const index = server.config.hiddenChannels.indexOf(id);
        if (index === -1) {
          await message.channel.send(`<#${id}> was not hidden.`);
          continue;
        }
        server.config.hiddenChannels.splice(index, 1);
        await message.channel.send(`<#${ch.id}> is un-hidden now.`);
      }
    }
  },
};

export default [hide, hidden, unhide];
