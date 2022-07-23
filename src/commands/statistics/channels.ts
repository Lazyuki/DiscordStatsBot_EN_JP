import { ChannelType } from 'discord.js';
import { BotCommand } from '@/types';
import { infoEmbed } from '@utils/embed';
import { getChannels } from '@database/statements';
import {
  channelsOrCategoriesToChannels,
  isInChannelsOrCategories,
  isTextChannel,
} from '@utils/guildUtils';
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
      : channelsOrCategoriesToChannels(
          server.config.hiddenChannels,
          server.guild
        );

    const channels = getChannels(
      {
        guildId: server.guild.id,
      },
      hiddenChannels
    );

    const ignoredChannels = channelsOrCategoriesToChannels(
      server.config.ignoredChannels,
      server.guild
    );

    const allChannels = [
      ...server.guild.channels.cache.filter(isTextChannel).values(),
    ];
    const deadChannels = allChannels.filter(
      (ch) =>
        !channels.some((row) => row.channelId === ch.id) &&
        ch.viewable &&
        ch.type !== ChannelType.GuildVoice &&
        !hiddenChannels.includes(ch.id) &&
        !ignoredChannels.includes(ch.id)
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

    const messageContent = infoEmbed({
      title: `Most active channels`,
      description: channelsString,
    });
    if (messageContent.embeds.length > 1) {
      const promises = messageContent.embeds.map(async (embed) => {
        await message.channel.send({ ...messageContent, embeds: [embed] });
      });
      await Promise.all(promises);
    } else {
      await message.channel.send(messageContent);
    }
  },
};

export default command;
