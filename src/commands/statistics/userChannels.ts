import { ChannelType, escapeMarkdown } from 'discord.js';
import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { infoEmbed } from '@utils/embed';
import { getUserChannels } from '@database/statements';
import {
  channelsOrCategoriesToChannels,
  isInChannelsOrCategories,
} from '@utils/guildUtils';
import { pluralCount } from '@utils/pluralize';

const command: BotCommand = {
  name: 'userChannel',
  description: 'Show top channels for a user',
  aliases: ['uch'],
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const userId = getUserId(bot, server, content) || message.author.id;
    const member = server.guild.members.cache.get(userId);

    const hiddenChannels = isInChannelsOrCategories(
      message,
      server.config.hiddenChannels
    )
      ? []
      : channelsOrCategoriesToChannels(
          server.config.hiddenChannels,
          server.guild
        );

    const channels = getUserChannels(
      {
        guildId: server.guild.id,
        userId: userId,
      },
      hiddenChannels
    ).filter((ch) => server.guild.channels.cache.has(ch.channelId));

    // Title
    const user = bot.users.cache.get(userId);
    const titleName = member
      ? `${escapeMarkdown(member.user.tag)}${
          member.nickname ? ` aka ${escapeMarkdown(member.nickname)}` : ''
        }`
      : user
      ? user.tag
      : `User <@${userId}>`;

    const channelsString = channels
      .map(({ channelId, count }) => {
        const channel = server.guild.channels.cache.get(channelId);
        return `**${channel?.type === ChannelType.GuildVoice ? '🔉' : '#'}${
          channel?.name || `*deleted (${channelId})*`
        }**: ${pluralCount('message', 's', count)}`;
      })
      .join('\n');

    await message.channel.send(
      infoEmbed({
        title: `Most active channels for ${titleName}`,
        description: channelsString,
      })
    );
  },
};

export default command;
