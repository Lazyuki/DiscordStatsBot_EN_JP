import { BotCommand } from '@/types';

declare module '@/types' {
  interface ServerConfig {
    ignoredChannels: string[];
  }
}

const command: BotCommand = {
  isAllowed: 'SERVER_MODERATOR',
  init: (config) => {
    config.ignoredChannels ||= [];
  },
  description:
    'Ignores a channel from statistics. Bot commands will still work there. Useful for ignoring noisy channels such as quiz or bot-spam channels.',
  arguments: '<#channel> [#channel2 ... ]',
  childCommands: ['ignored', 'unignore'],
  normalCommand: async ({ commandContent, message, server }) => {
    const chan = server.guild.channels.cache.get(commandContent);
    if (chan) {
      if (server.config.ignoredChannels.includes(chan.id)) return;
      server.config.ignoredChannels.push(chan.id);
      message.channel.send(`<#${chan.id}> is ignored now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        if (server.config.ignoredChannels.includes(id)) return;
        server.config.ignoredChannels.push(id);
        message.channel.send(`<#${ch.id}> is ignored now.`);
      }
    }
  },
};

export default command;
