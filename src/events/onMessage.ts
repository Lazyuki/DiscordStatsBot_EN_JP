import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

import { BotEvent } from '@/types';
import { dbInsertMessages } from '@database/statements';
import { getToday } from '@utils/formatStats';
import checkLang from '@utils/checkLang';
import { getParentChannelId, isMessageInChannels } from '@utils/guildUtils';
import checkSafeMessage from '@utils/checkSafeMessage';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }

    const server = bot.servers[message.guild.id];
    const guildId = message.guild.id;
    const channelId = getParentChannelId(message.channel);
    if (isMessageInChannels(message, server.config.ignoredChannels)) return;

    const userId = message.member.id;
    const date = getToday();
    const { lang } = checkLang(message.content);

    dbInsertMessages.run({
      guildId,
      userId,
      channelId,
      date,
      lang,
      messageCount: 1,
    });
  },
};

export default event;
