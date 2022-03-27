import { parseChannels, parseSnowflakeIds } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getChannelLeaderboard } from '@database/statements';
import { getMessageTextChannel, idToChannel } from '@utils/guildUtils';
import { fieldsPaginator } from '@utils/paginate';
import { joinNaturally } from '@utils/formatString';
import { CommandArgumentError } from '@/errors';

const command: BotCommand = {
  name: 'channelLeaderboard',
  description:
    'Show leaderboard for channels. Default to the current channel if nothing is specified.',
  aliases: ['chlb', 'cl'],
  arguments: '[#channel1, #channel2...] [@user]',
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const { channels, nonChannelIds } = parseChannels(content, server.guild);
    if (channels.length === 0) {
      const thisChannel = getMessageTextChannel(message);
      thisChannel && channels.push(thisChannel);
    }
    if (channels.length === 0) {
      throw new CommandArgumentError('Please specify a channel');
    }
    const users = getChannelLeaderboard(
      {
        guildId: server.guild.id,
      },
      channels.map((c) => c.id)
    );
    const authorId = message.author.id;
    let searchUserId = authorId;
    if (nonChannelIds.length > 0) {
      const memberIds = nonChannelIds.filter((id) =>
        server.guild.members.cache.has(id)
      );
      if (memberIds.length > 0) {
        searchUserId = memberIds[0];
      } else {
        await message.react('❓');
      }
    }
    const userIndex = users.findIndex((u) => u.userId === searchUserId);

    const fields = users.map(({ userId, count }, index) => {
      const user = bot.users.cache.get(userId)?.username || `*${userId}*`;
      return {
        name: `${index + 1}) ${user}${userId === searchUserId ? '📍' : ''}`,
        value: `${count}`,
      };
    });
    await fieldsPaginator(
      message.channel,
      `Channel Leaderboard for ${joinNaturally(
        channels.map((c) => `#${c.name}`)
      )}`,
      'Total messages in the last 30 days',
      fields,
      true,
      userIndex,
      authorId
    );
  },
};

export default command;
