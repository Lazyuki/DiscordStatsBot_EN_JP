import { deleteWatched } from '@database/statements';

import { BotEvent } from '@/types';

const event: BotEvent<'guildBanAdd'> = {
  eventName: 'guildBanAdd',
  skipOnDebug: true,
  processEvent: async (bot, banInfo) => {
    const server = bot.servers[banInfo.guild.id];
    const bannedUserId = banInfo.user.id;
    if (server.temp.watched.includes(bannedUserId)) {
      deleteWatched({ guildId: server.guild.id, userId: bannedUserId });
      server.temp.watched = server.temp.watched.filter(
        (id) => id !== bannedUserId
      );
    }
  },
};

export default event;
