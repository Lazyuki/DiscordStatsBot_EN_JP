import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import { getMessageTextChannel } from '@utils/guildUtils';
import { safeDelete } from '@utils/safeDelete';
import { ChannelType } from 'discord.js';

const command: BotCommand = {
  name: 'channelTopic',
  aliases: ['ct'],
  description: 'Show the channel topic',
  rateLimitSeconds: 10,
  normalCommand: async ({ message }) => {
    const channel = getMessageTextChannel(message);
    if (!channel) return; // Not a channel??
    safeDelete(message);
    await message.channel.send(
      makeEmbed({
        title: `Channel topic for #${channel.name}`,
        description:
          (channel.type !== ChannelType.GuildVoice && channel.topic) || 'None',
      })
    );
  },
};

export default command;
