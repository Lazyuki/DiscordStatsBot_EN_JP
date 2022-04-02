import { BotEvent } from '@/types';
import { insertDeletes, insertMessages } from '@database/statements';
import { DELETE_COLOR, EJLX, MAINICHI, MOD_LOG } from '@utils/constants';
import checkSafeMessage from '@utils/checkSafeMessage';
import {
  getParentChannelId,
  getTextChannel,
  isMessageInChannels,
  isNotDM,
} from '@utils/guildUtils';
import { makeEmbed } from '@utils/embed';
import { formatDuration, intervalToDuration } from 'date-fns';

const event: BotEvent<'messageDelete'> = {
  eventName: 'messageDelete',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    const guildId = message.guild.id;
    const channelId = getParentChannelId(message.channel);
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
