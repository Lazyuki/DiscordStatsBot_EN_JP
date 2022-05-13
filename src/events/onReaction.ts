import { BotEvent } from '@/types';
import { insertEmojis } from '@database/statements';
import checkSafeMessage from '@utils/checkSafeMessage';
import { SUGGESTIONS_FORUM, SUGGESTIONS } from '@utils/constants';
import { isMessageInChannels } from '@utils/guildUtils';

const IGNORED_REACTIONS = [
  '<:english:439733745591779328>',
  '<:japanese:439733745390583819>',
  '<:other_lang:815698119810875453>',
];

const reactionAdd: BotEvent<'messageReactionAdd'> = {
  eventName: 'messageReactionAdd',
  skipOnDebug: false,
  processEvent: async (bot, reaction, user) => {
    const message = reaction.message;
    if (!checkSafeMessage(bot, message)) return;
    const server = bot.servers[message.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    if (isMessageInChannels(message, [SUGGESTIONS_FORUM, SUGGESTIONS])) return; // Ignore EJLX Suggesions

    const reactionString = reaction.emoji.toString();
    if (IGNORED_REACTIONS.includes(reactionString)) return;
    insertEmojis({
      guildId: server.guild.id,
      userId: user.id,
      emoji: reactionString,
      emojiCount: 1,
      date: bot.utcHour,
    });
  },
};

const reactionRemove: BotEvent<'messageReactionRemove'> = {
  eventName: 'messageReactionRemove',
  skipOnDebug: false,
  processEvent: async (bot, reaction, user) => {
    const message = reaction.message;
    if (!checkSafeMessage(bot, message)) return;
    const server = bot.servers[message.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    if (isMessageInChannels(message, [SUGGESTIONS_FORUM, SUGGESTIONS])) return; // Ignore EJLX Suggesions

    const reactionString = reaction.emoji.toString();
    if (IGNORED_REACTIONS.includes(reactionString)) return;
    insertEmojis({
      guildId: server.guild.id,
      userId: user.id,
      emoji: reactionString,
      emojiCount: -1,
      date: bot.utcDay,
    });
  },
};

export default [reactionAdd, reactionRemove];
