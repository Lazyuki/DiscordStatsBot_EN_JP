import { BotCommand } from '../../types';

const command: BotCommand = {
  isAllowed: 'ADMIN',
  description: 'Show ignored channels',
  normalCommand: async ({ message, server }) => {
    const channels = server.config.ignoredChannels;
    let s = '';
    for (const channelId of channels) {
      s += `<#${channelId}>\n`;
    }
    message.channel.send(s);
  },
};

export default command;
