import { BotEvent } from '@/types';
import {
  insertEmojis,
  insertMessages,
  insertStickers,
} from '@database/statements';
import checkLang from '@utils/checkLang';
import { getParentChannelId, isMessageInChannels } from '@utils/guildUtils';
import checkSafeMessage from '@utils/checkSafeMessage';
import { REGEX_CUSTOM_EMOTES, REGEX_UNICODE_EMOJI } from '@utils/regex';
import { SUGGESTIONS, SUGGESTIONS_FORUM } from '@utils/constants';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }

    const server = bot.servers[message.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    const guildId = message.guild.id;
    const channelId = getParentChannelId(message.channel);
    if (isMessageInChannels(message, server.config.ignoredChannels)) return;

    const userId = message.member.id;
    const date = bot.utcDay;
    const { lang } = checkLang(message.content);

    insertMessages({
      guildId,
      userId,
      channelId,
      date,
      lang,
      messageCount: 1,
    });

    const emojis: Record<string, number> = {};

    const isEjlxSuggestions = isMessageInChannels(message, [
      SUGGESTIONS_FORUM,
      SUGGESTIONS,
    ]);

    if (!isEjlxSuggestions) {
      const discordEmojis = message.content.match(REGEX_CUSTOM_EMOTES);
      if (discordEmojis) {
        for (const emoji of discordEmojis) {
          if (emoji in emojis) {
            emojis[emoji] += 1;
          } else {
            emojis[emoji] = 1;
          }
        }
      }
    }

    const unicodeEmojiMatches = message.content.matchAll(REGEX_UNICODE_EMOJI);
    if (unicodeEmojiMatches) {
      for (const emojiMatch of unicodeEmojiMatches) {
        const emoji = emojiMatch[0];
        if (emoji in emojis) {
          emojis[emoji] += 1;
        } else {
          emojis[emoji] = 1;
        }
      }
    }
    Object.entries(emojis).forEach(([emoji, emojiCount]) => {
      insertEmojis({
        guildId,
        userId,
        date,
        emoji,
        emojiCount,
      });
    });

    if (!isEjlxSuggestions) {
      if (message.stickers?.size) {
        message.stickers.forEach((sticker) => {
          insertStickers({
            guildId,
            userId,
            date,
            sticker: `${sticker.name}:${sticker.guildId}`,
            stickerCount: 1,
          });
        });
      }
    }
  },
};

export default event;
