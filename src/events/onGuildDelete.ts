import logger, { discordLogInfo } from '@/logger';
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
    // clearModLogForGuild({ guildId: guild.id }); // Delete all mod log entries
    clearWatchedForGuild({ guildId: guild.id }); // Delete all watched users
    // deleteGuild({ guildId: guild.id }); // Delete guild (causes NULL REFERENCE?)
    const message = `Deleted Guild "${guild.name}" (ID: ${guild.id}, Members: ${guild.memberCount})`;
    discordLogInfo(bot, `<@${bot.ownerId}>\n${message}`);

    logger.info(message);
  },
};

export default event;
