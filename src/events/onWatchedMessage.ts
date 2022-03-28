import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

import { BotEvent } from '@/types';
import { isNotDM } from '@utils/guildUtils';
import logger from '@/logger';
import checkSafeMessage from '@utils/checkSafeMessage';

async function storeMediaTemporarily(id: string, mediaLink: string) {}

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    const userId = message.member.id;
    if (!server.temp.watched.includes(userId)) return;

    if (message.attachments.size > 0) {
      message.attachments.forEach((attachment) => {
        if ('height' in attachment) {
          // image or video
          logger.info(
            `Attachment: type=${attachment.contentType}, size=${attachment.size}, proxy=${attachment.proxyURL}, url=${attachment.url}`
          );
          // no need to await, it's not important
          storeMediaTemporarily(attachment.id, attachment.proxyURL);
        }
      });
    }
  },
};

export default event;
