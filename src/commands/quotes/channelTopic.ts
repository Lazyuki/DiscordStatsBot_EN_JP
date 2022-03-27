import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'channelTopic',
  aliases: ['ct'],
  description: 'Channel topic',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    const channel = message.channel.isThread()
      ? message.channel.parent
      : message.channel;
    if (!channel) return; // Not a channel?
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        title: `Channel topic for #${channel.name}`,
        description: channel.topic || 'None',
      })
    );
  },
};

export default command;
