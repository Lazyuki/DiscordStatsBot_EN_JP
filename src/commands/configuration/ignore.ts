import { BotCommand } from '@/types';

declare module '@/types' {
  interface ServerConfig {
    ignoredChannels: string[];
  }
}

const ignore: BotCommand = {
  name: 'ignore',
  isAllowed: 'SERVER_MODERATOR',
  onCommandInit: (config) => {
    config.ignoredChannels ||= [];
  },
  description:
    'Ignore a channel from statistics. Bot commands will still work there. Useful for ignoring noisy channels such as quiz or bot-spam channels.',
  arguments: '<#channel> [#channel2 ... ]',
  childCommands: ['ignored', 'unignore'],
  normalCommand: async ({ commandContent, message, server }) => {
    const chan = server.guild.channels.cache.get(commandContent);
    if (chan) {
      if (server.config.ignoredChannels.includes(chan.id)) return;
      server.config.ignoredChannels.push(chan.id);
      await message.channel.send(`<#${chan.id}> is ignored now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        if (server.config.ignoredChannels.includes(id)) return;
        server.config.ignoredChannels.push(id);
        await message.channel.send(`<#${ch.id}> is ignored now.`);
      }
    }
  },
};

const ignored: BotCommand = {
  name: 'ignored',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Show ignored channels',
  parentCommand: 'ignore',
  normalCommand: async ({ message, server }) => {
    const channels = server.config.ignoredChannels;
    let s = '';
    for (const channelId of channels) {
      s += `<#${channelId}>\n`;
    }
    await message.channel.send(s);
  },
};

const unignore: BotCommand = {
  name: 'unignore',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Un-ignore channels',
  parentCommand: 'ignore',
  normalCommand: async ({ message, server, commandContent }) => {
    const chan = server.guild.channels.cache.get(commandContent);
    if (chan) {
      const index = server.config.ignoredChannels.indexOf(chan.id);
      if (index === -1) {
        await message.channel.send(`<#${chan.id}> was not being ignored.`);
        return;
      }
      server.config.ignoredChannels.splice(index, 1);
      await message.channel.send(`<#${chan.id}> is un-ignored now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        const index = server.config.ignoredChannels.indexOf(id);
        if (index === -1) {
          await message.channel.send(`<#${id}> was not being ignored.`);
          continue;
        }
        server.config.ignoredChannels.splice(index, 1);
        await message.channel.send(`<#${ch.id}> is un-ignored now.`);
      }
    }
  },
};

export default [ignore, ignored, unignore];
