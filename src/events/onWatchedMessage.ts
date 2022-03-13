import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

import { BotEvent } from '@/types';
import { isNotDM } from '@utils/typeGuards';
import logger from '@/logger';

async function storeMediaTemporarily(id: string, mediaLink: string) {}

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (message.author.bot || message.system) return;
    if (/^(,,?,?|[.>\[$=+%&]|[tk]!|-h)[a-zA-Z]/.test(message.content)) return; // Bot commands
    const server = bot.servers[message.guild.id];
    const userId = message.member.id;
    if (!server.cache.watched.includes(userId)) return;

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
