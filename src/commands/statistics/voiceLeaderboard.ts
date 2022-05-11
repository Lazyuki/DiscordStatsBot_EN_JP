import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getVoiceLeaderboard } from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';
import { secondsToVcTime } from '@utils/datetime';

const command: BotCommand = {
  name: 'voiceLeaderboard',
  description: 'Show VC leaderboard for this server.',
  aliases: ['vclb', 'v', 'vc'],
  arguments: '[@user]',
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const users = getVoiceLeaderboard({
      guildId: server.guild.id,
    });
    let searchUserId = message.author.id;
    let openToPin = false;
    const contentUserId = getUserId(bot, server, content);
    if (contentUserId) {
      openToPin = true;
      searchUserId = contentUserId;
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
          value: `${secondsToVcTime(count)}`,
        };
      })
    );
    await fieldsPaginator(
      message.channel,
      `Voice Leaderboard`,
      'For the last 30 days',
      fields,
      true,
      userIndex,
      message.author.id,
      openToPin
    );
  },
};

export default command;
