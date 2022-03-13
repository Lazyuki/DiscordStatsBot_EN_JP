import logger from '@/logger';
import { BotEvent } from '@/types';
import {
  clearModLogForGuild,
  clearWatchedForGuild,
  deleteGuild,
} from '@database/statements';

const event: BotEvent<'guildDelete'> = {
  eventName: 'guildDelete',
  skipOnDebug: false,
  processEvent: async (bot, guild) => {
    delete bot.servers[guild.id];
    clearModLogForGuild.run({ guildId: guild.id }); // Delete all mod log entries
    clearWatchedForGuild.run({ guildId: guild.id }); // Delete all watched users
    // deleteGuild.run({ guildId: guild.id }); // Delete guild (causes NULL REFERENCE?)

    logger.info(
      `Guild "${guild.name}" (ID: ${guild.id}, Members: ${guild.memberCount}) deleted`
    );
  },
};

export default event;
