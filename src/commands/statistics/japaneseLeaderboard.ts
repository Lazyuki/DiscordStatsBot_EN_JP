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
        'Minimum total messages required to show up on on the leaderboard. Default: 100',
      bool: false,
    },
  ],
  arguments: '[user (default: command invoker)]',
  requiredServerConfigs: ['japaneseRoles', 'statistics'],
  examples: ['jpl', 'jpl -n 1000', 'jpl @Geralt'],
  normalCommand: async ({ message, bot, server, content, options }) => {
    const japaneseRoles = server.config.japaneseRoles;
    let searchUserId = message.author.id;
    let openToPin = false;
    const contentUserId = getUserId(bot, server, content);
    if (contentUserId) {
      openToPin = true;
      searchUserId = contentUserId;
    } else if (content) {
      await message.react('❓');
    }

    let threshold = 100;
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

    const fields = await Promise.all(
      nonJpUsers.map(async ({ userId, jpRatio }, index) => {
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
          value: `${jpRatio.toFixed(2)}%`,
        };
      })
    );
    await fieldsPaginator(
      message.channel,
      `Japanese Usage Leaderboard`,
      `For the last 30 days [Minimum messages: ${threshold}]`,
      fields,
      true,
      userIndex,
      message.author.id,
      openToPin
    );
  },
};

export default command;
