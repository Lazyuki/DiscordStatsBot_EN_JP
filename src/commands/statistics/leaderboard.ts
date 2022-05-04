import { parseMembers, parseSnowflakeIds } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getChannelLeaderboard, getLeaderboard } from '@database/statements';
import { idToChannel } from '@utils/guildUtils';
import { fieldsPaginator } from '@utils/paginate';
import { joinNaturally } from '@utils/formatString';

const command: BotCommand = {
  name: 'leaderboard',
  description: 'Show leaderboard for this server.',
  aliases: ['lb', 'l'],
  arguments: '[@user]',
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const { ids } = parseSnowflakeIds(content);
    const users = getLeaderboard({
      guildId: server.guild.id,
    });
    const authorId = message.author.id;
    let searchUserId = authorId;
    if (ids.length > 0) {
      searchUserId = ids[0];
    } else if (content) {
      await message.react('❓');
    }
    const userIndex = users.findIndex((u) => u.userId === searchUserId);

    const fields = await Promise.all(
      users.map(async ({ userId, count }, index) => {
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
          value: `${count}`,
        };
      })
    );
    await fieldsPaginator(
      message.channel,
      `Server Leaderboard`,
      'Total messages in the last 30 days',
      fields,
      true,
      userIndex,
      authorId
    );
  },
};

export default command;
