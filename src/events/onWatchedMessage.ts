import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

import { BotEvent } from '@/types';
import { getTextChannel, isNotDM } from '@utils/guildUtils';
import logger from '@/logger';
import checkSafeMessage from '@utils/checkSafeMessage';
import { makeEmbed } from '@utils/embed';
import { DELETE_COLOR } from '@utils/constants';
import { millisToDuration } from '@utils/datetime';

async function storeMediaTemporarily(id: string, mediaLink: string) {}

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    const userId = message.member.id;
    // TODO: post watched
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

const updateEvent: BotEvent<'messageUpdate'> = {
  eventName: 'messageUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMessage, newMessage) => {
    if (newMessage.partial) return;
    // TODO : watched edit
  },
};

const event: BotEvent<'messageDelete'> = {
  eventName: 'messageDelete',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];

    if (server.temp.watched.includes(message.author.id)) {
      const modLog = getTextChannel(message.guild, server.config.modLogChannel);
      if (!modLog) return;

      // wait for potential images to be downloaded
      setTimeout(() => {
        if (message.attachments.size > 0) {
          // TODO: images
          message.attachments.forEach((attachment) => {});
        } else if (message.content.length <= 3) {
          // too short to care
          return;
        }
        const timeDiffMillis = new Date().getTime() - message.createdTimestamp;
        const channelName = message.channel.name;

        modLog.send(
          makeEmbed({
            color: DELETE_COLOR,
            authorName: `${message.author.tag} (${message.author})`,
            authorIcon: `${message.author.displayAvatarURL()}`,
            title: `Message Deleted after ${millisToDuration(timeDiffMillis)}`,
            description: message.content,
            footer: `#${channelName} (${message.channel.id})`,
            timestamp: true,
          })
        );
      }, 3000);
    }
  },
};

export default [createEvent, updateEvent];
