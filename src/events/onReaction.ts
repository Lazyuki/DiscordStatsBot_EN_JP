import { BotEvent } from '@/types';
import { insertEmojis } from '@database/statements';
import checkSafeMessage from '@utils/checkSafeMessage';

const reactionAdd: BotEvent<'messageReactionAdd'> = {
  eventName: 'messageReactionAdd',
  skipOnDebug: false,
  processEvent: async (bot, reaction, user) => {
    const message = reaction.message;
    if (!checkSafeMessage(bot, message)) return;
    const server = bot.servers[message.guild.id];

    const reactionString = reaction.emoji.toString();
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

    const reactionString = reaction.emoji.toString();
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
