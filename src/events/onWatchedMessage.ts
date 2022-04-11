import { BotEvent } from '@/types';
import { fetchMessage, getTextChannel, isNotDM } from '@utils/guildUtils';
import logger from '@/logger';
import checkSafeMessage from '@utils/checkSafeMessage';
import { makeEmbed, splitFields } from '@utils/embed';
import { DELETE_COLOR, EDIT_COLOR } from '@utils/constants';
import {
  downloadMessageAttachments,
  getDeletedAttachments,
} from '@utils/images';
import { millisToDuration } from '@utils/datetime';
import { REGEX_URL } from '@utils/regex';
import { MessageAttachment } from 'discord.js';

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    const userId = message.member.id;
    if (!server.temp.watched.includes(userId)) return;
    if (message.attachments.size > 0) {
      await downloadMessageAttachments(message);
    }
  },
};

const updateEvent: BotEvent<'messageUpdate'> = {
  eventName: 'messageUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMessage, newMessage) => {
    if (!isNotDM(newMessage)) return; // DM
    if (newMessage.partial || oldMessage.partial) return;
    const server = bot.servers[newMessage.guild.id];
    if (!server.temp.watched.includes(newMessage.author.id)) return; // Not watched
    const modLog = getTextChannel(
      newMessage.guild,
      server.config.modLogChannel
    );
    if (!modLog) return;
    const distance = levenshteinDistance(
      oldMessage.content,
      newMessage.content
    );
    if (distance <= 3) return;
    const timeDiffMillis =
      newMessage.editedTimestamp! - newMessage.createdTimestamp;
    const channelName = newMessage.channel.name;
    await modLog.send(
      makeEmbed({
        color: EDIT_COLOR,
        authorName: `${newMessage.author.tag} (${newMessage.author.id})`,
        authorIcon: `${newMessage.author.displayAvatarURL()}`,
        title: `Message Edited after ${millisToDuration(timeDiffMillis)}`,
        fields: splitFields([
          { name: 'Before', value: oldMessage.content, inline: false },
          { name: 'After', value: newMessage.content, inline: false },
        ]),
        footer: `#${channelName} (${newMessage.channel.id})`,
        timestamp: true,
      })
    );
  },
};

const deleteEvent: BotEvent<'messageDelete'> = {
  eventName: 'messageDelete',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (message.system) return; // System
    if (!isNotDM(message)) return; // DM
    if (!message.author) return;

    const server = bot.servers[message.guild.id];
    let hasEmbedPreview = false;
    let deletedFiles: MessageAttachment[] = [];

    if (server.temp.watched.includes(message.author.id)) {
      const modLog = getTextChannel(message.guild, server.config.modLogChannel);
      if (!modLog) return;
      if (message.attachments.size > 0) {
        deletedFiles = getDeletedAttachments(message.id);
      } else if (message.content) {
        // No attachments so just send the deleted message
        if (message.content.length <= 3) return; // too short
        // bot commands
        if (server.temp.ignoredBotPrefixRegex?.test(message.content)) return;
        if (message.content.startsWith(server.config.prefix)) return;
        if (message.embeds.length) {
        }
      }
      const timeDiffMillis = new Date().getTime() - message.createdTimestamp;
      const channelName = message.channel.name;
      const deleteLog = await modLog.send(
        makeEmbed({
          color: DELETE_COLOR,
          authorName: `${message.author.tag} (${message.author.id})`,
          authorIcon: `${message.author.displayAvatarURL()}`,
          title: `Message Deleted after ${millisToDuration(timeDiffMillis)}`,
          description: message.content || '*empty*',
          footer: `#${channelName} (${message.channel.id})`,
          timestamp: true,
        })
      );
      if (hasEmbedPreview || deletedFiles.length) {
        const thread = await deleteLog.startThread({
          name: 'Deleted Message Attachments',
          autoArchiveDuration: 60,
        });
        let content = 'Deleted Preview Embeds and Attachments:\n';
        if (hasEmbedPreview) {
          const allUrls = message.content?.match(REGEX_URL);
          if (allUrls) {
            content += allUrls.join('\n');
          }
        }
        await thread.send({ content, files: deletedFiles });
        await thread.setArchived(true, 'End sending attachments');
      }
    }
  },
};
/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 */
function levenshteinDistance(source: string, target: string) {
  const m = source.length;
  const n = target.length;
  const INF = m + n;
  const score = new Array(m + 2);
  const sd: Record<string, number> = {};

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

export default [createEvent, updateEvent, deleteEvent];
