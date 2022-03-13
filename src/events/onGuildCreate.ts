import logger from '@/logger';
import { BotEvent } from '@/types';
import Server from '@classes/Server';
import { dbInsertServer } from '@database/statements';

const event: BotEvent<'guildCreate'> = {
  eventName: 'guildCreate',
  skipOnDebug: false,
  processEvent: async (bot, guild) => {
    bot.servers[guild.id] = new Server(guild, bot);
    dbInsertServer.run({ guildId: guild.id });
    logger.info(
      `Guild "${guild.name}" (ID: ${guild.id}, Members: ${guild.memberCount}) added`
    );
  },
};

export default event;
