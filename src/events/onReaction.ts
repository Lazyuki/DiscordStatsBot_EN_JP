import { BotEvent } from '@/types';
import { dbInsertEmojis } from '@database/statements';
import checkSafeMessage from '@utils/checkSafeMessage';
import { getToday } from '@utils/formatStats';

const reactionAdd: BotEvent<'messageReactionAdd'> = {
  eventName: 'messageReactionAdd',
  skipOnDebug: false,
  processEvent: async (bot, reaction, user) => {
    const message = reaction.message;
    if (!checkSafeMessage(bot, message)) return;
    const server = bot.servers[message.guild.id];

    const reactionString = reaction.emoji.toString();
    dbInsertEmojis.run({
      guildId: server.guild.id,
      userId: user.id,
      emoji: reactionString,
      emojiCount: 1,
      date: getToday(),
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
    dbInsertEmojis.run({
      guildId: server.guild.id,
      userId: user.id,
      emoji: reactionString,
      emojiCount: -1,
      date: getToday(),
    });
  },
};

export default [reactionAdd, reactionRemove];
