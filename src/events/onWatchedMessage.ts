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
    // ignore distance <= 2
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
/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 */
function distance(source: string, target: string) {
  let m = source.length,
    n = target.length,
    INF = m + n,
    score = new Array(m + 2),
    sd: Record<string, number> = {};
  for (let i = 0; i < m + 2; i++) score[i] = new Array(n + 2);
  score[0][0] = INF;
  for (let i = 0; i <= m; i++) {
    score[i + 1][1] = i;
    score[i + 1][0] = INF;
    sd[source[i]] = 0;
  }
  for (let j = 0; j <= n; j++) {
    score[1][j + 1] = j;
    score[0][j + 1] = INF;
    sd[target[j]] = 0;
  }

  for (let i = 1; i <= m; i++) {
    let DB = 0;
    for (let j = 1; j <= n; j++) {
      let i1 = sd[target[j - 1]],
        j1 = DB;
      if (source[i - 1] === target[j - 1]) {
        score[i + 1][j + 1] = score[i][j];
        DB = j;
      } else {
        score[i + 1][j + 1] =
          Math.min(score[i][j], score[i + 1][j], score[i][j + 1]) + 1;
      }
      score[i + 1][j + 1] = Math.min(
        score[i + 1][j + 1],
        score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity
      );
    }
    sd[source[i - 1]] = i;
  }
  return score[m + 1][n + 1];
}

export default [createEvent, updateEvent];
