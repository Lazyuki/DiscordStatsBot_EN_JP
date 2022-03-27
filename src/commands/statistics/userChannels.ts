import { Util } from 'discord.js';
import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { infoEmbed } from '@utils/embed';
import { getUserChannels } from '@database/statements';
import { isInChannelsOrCategories } from '@utils/guildUtils';
import pluralize from '@utils/pluralize';

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
      : server.config.hiddenChannels;
    const channels = getUserChannels(
      {
        guildId: server.guild.id,
        userId: userId,
      },
      hiddenChannels
    );

    // Title
    const user = bot.users.cache.get(userId);
    const titleName = member
      ? `${Util.escapeMarkdown(member.user.tag)}${
          member.nickname ? ` aka ${Util.escapeMarkdown(member.nickname)}` : ''
        }`
      : user
      ? user.tag
      : `User <@${userId}>`;

    const channelsString = channels
      .map(({ channelId, count }) => {
        const channel = server.guild.channels.cache.get(channelId);
        return `**#${
          channel?.name || `deleted (${channelId})`
        }**: ${count} ${pluralize('message', 's', count)}`;
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
