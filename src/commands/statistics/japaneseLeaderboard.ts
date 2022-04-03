import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getJapaneseLeaderboard } from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';

const command: BotCommand = {
  name: 'japaneseLeaderboard',
  description: 'Japanese usage leaderboard',
  aliases: ['jpl', 'jplb'],
  options: [
    {
      name: 'threshold',
      short: 'n',
      description:
        'Minimum total messages required to show up on on the leaderboard. Default: 500',
      bool: false,
    },
  ],
  arguments: '[user (default: command invoker)]',
  requiredServerConfigs: ['japaneseRoles', 'statistics'],
  examples: ['jpl', 'jpl -n 1000', 'jpl @Geralt'],
  normalCommand: async ({ message, bot, server, content, options }) => {
    const japaneseRoles = server.config.japaneseRoles;
    const searchUserId = getUserId(bot, server, content) || message.author.id;

    let threshold = 500;
    if (options['threshold']) {
      const parsedThreshold = parseInt(options['threshold'] as string);
      if (!isNaN(parsedThreshold)) {
        threshold = parsedThreshold;
      }
    }
    const users = getJapaneseLeaderboard({
      guildId: server.guild.id,
      threshold,
    });

    const nonJpUsers = users.filter((u) => {
      const member = server.guild.members.cache.get(u.userId);
      return member && !member.roles.cache.hasAny(...japaneseRoles);
    });

    const userIndex = nonJpUsers.findIndex((u) => u.userId === searchUserId);

    const fields = nonJpUsers.map(({ userId, jpRatio }, index) => {
      const user = bot.users.cache.get(userId)?.username || `*${userId}*`;
      return {
        name: `${index + 1}) ${user}${userId === searchUserId ? '📍' : ''}`,
        value: `${jpRatio.toFixed(2)}%`,
      };
    });
    await fieldsPaginator(
      message.channel,
      `Japanese Usage Leaderboard`,
      `For the last 30 days [Minimum messages: ${threshold}]`,
      fields,
      true,
      userIndex,
      message.author.id
    );
  },
};

export default command;
