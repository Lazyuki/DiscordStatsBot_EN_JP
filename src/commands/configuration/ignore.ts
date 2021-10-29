import { BotCommand } from '../../types';
import { EJLX } from '../../utils/ejlxConstants';

declare module '../../types' {
  interface ServerSettings {
    ignoredChannels: string[];
  }
}

const command: BotCommand = {
  allowedServers: [EJLX],
  isAllowed: 'ADMIN',
  init: (settings, json) =>
    (settings.ignoredChannels = json.ignoredChannels || []),
  description:
    'Ignores a channel from leaderboards. Commands will still work there',
  arguments: '<#chanel-name>',
  normalCommand: async (content, message, server) => {
    const chan = server.guild.channels.cache.get(content);
    if (chan) {
      if (server.settings.ignoredChannels.includes(chan.id)) return;
      server.settings.ignoredChannels.push(chan.id);
      message.channel.send(`<#${chan.id}> is ignored now.`);
    } else if (message.mentions.channels.size !== 0) {
      for (const [id, ch] of message.mentions.channels) {
        if (server.settings.ignoredChannels.includes(id)) return;
        server.settings.ignoredChannels.push(id);
        message.channel.send(`<#${ch.id}> is ignored now.`);
      }
    }
  },
};

export default command;
