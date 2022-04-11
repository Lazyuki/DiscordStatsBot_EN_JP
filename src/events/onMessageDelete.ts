import { BotEvent } from '@/types';
import { insertDeletes } from '@database/statements';
import checkSafeMessage from '@utils/checkSafeMessage';
import { isMessageInChannels } from '@utils/guildUtils';

const event: BotEvent<'messageDelete'> = {
  eventName: 'messageDelete',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    const guildId = message.guild.id;
    const userId = message.author.id;
    if (!isMessageInChannels(message, server.config.ignoredChannels)) {
      insertDeletes({
        guildId,
        userId,
        date: bot.utcDay,
        deleteCount: 1,
      });
    }
  },
};

export default event;
