import { getUserId, parseMembers } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getEnglishLeaderboard } from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';

const command: BotCommand = {
  name: 'englishLeaderboard',
  description: 'English usage leaderboard',
  aliases: ['enl', 'enlb'],
  options: [
    {
      name: 'threshold',
      short: 'n',
      description:
        'Minimum total messages required to show up on on the leaderboard. Default: 100',
      bool: false,
    },
  ],
  arguments: '[user (default: command invoker)]',
  requiredServerConfigs: ['japaneseRoles', 'statistics'],
  examples: ['enl', 'enl -n 1000', 'enl @Geralt'],
  normalCommand: async ({ message, bot, server, content, options }) => {
    const japaneseRoles = server.config.japaneseRoles;
    const searchUserId = getUserId(bot, server, content) || message.author.id;

    let threshold = 100;
    if (options['threshold']) {
      const parsedThreshold = parseInt(options['threshold'] as string);
      if (!isNaN(parsedThreshold)) {
        threshold = parsedThreshold;
      }
    }
    const users = getEnglishLeaderboard({
      guildId: server.guild.id,
      threshold,
    });

    const jpUsers = users.filter((u) => {
      const member = server.guild.members.cache.get(u.userId);
      return member && member.roles.cache.hasAny(...japaneseRoles);
    });

    const userIndex = jpUsers.findIndex((u) => u.userId === searchUserId);

    const fields = await Promise.all(
      jpUsers.map(async ({ userId, enRatio }, index) => {
        let user = bot.users.cache.get(userId);
        if (!user && index < 100) {
          // fetch active users
          user = await bot.users.fetch(userId);
        }
        const userName = user?.username || `User:${userId}`;
        const userLeft = !server.guild.members.resolve(userId);
        return {
          name: `${index + 1}) ${userLeft ? '📤 ' : ''}${userName}${
            userId === searchUserId ? '📍' : ''
          }`,
          value: `${enRatio.toFixed(2)}%`,
        };
      })
    );
    await fieldsPaginator(
      message.channel,
      `English Usage Leaderboard`,
      `Total messages in the last 30 days [Minimum messages: ${threshold}]`,
      fields,
      true,
      userIndex,
      message.author.id
    );
  },
};

export default command;
