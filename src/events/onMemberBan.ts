import { BotEvent } from '@/types';
import { deleteWatched } from '@database/statements';

const event: BotEvent<'guildBanAdd'> = {
  eventName: 'guildBanAdd',
  skipOnDebug: false,
  processEvent: async (bot, ban) => {
    const guild = ban.guild;
    const server = bot.servers[guild.id];
    const user = ban.user;
    const index = server.temp.watched.indexOf(user.id);
    if (index === -1) return;
    server.temp.watched.splice(index, 1);
    deleteWatched({ guildId: guild.id, userId: user.id });
  },
};

export default event;
