import { Util } from 'discord.js';
import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { infoEmbed } from '@utils/embed';
import { getChannels, getUserChannels } from '@database/statements';
import { isInChannelsOrCategories, isTextChannel } from '@utils/guildUtils';
import { pluralCount } from '@utils/pluralize';

const command: BotCommand = {
  name: 'channels',
  description: 'Show channels in the message count order',
  aliases: ['ch'],
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const hiddenChannels = isInChannelsOrCategories(
      message,
      server.config.hiddenChannels
    )
      ? []
      : server.config.hiddenChannels;

    const channels = getChannels(
      {
        guildId: server.guild.id,
      },
      hiddenChannels
    );

    const allChannels = [
      ...server.guild.channels.cache.filter(isTextChannel).values(),
    ];
    const deadChannels = allChannels.filter(
      (ch) => !channels.some((row) => row.channelId === ch.id)
    );

    let channelsString =
      channels
        .map(({ channelId, count }) => {
          const channel = server.guild.channels.cache.get(channelId);
          return `**#${
            channel?.name || `*deleted (${channelId})*`
          }**: ${pluralCount('message', 's', count)}`;
        })
        .join('\n') + '\n';
    channelsString += deadChannels
      .map((channel) => `**#${channel.name}**: 0 messages`)
      .join('\n');

    await message.channel.send(
      infoEmbed({
        title: `Most active channels`,
        description: channelsString,
      })
    );
  },
};

export default command;