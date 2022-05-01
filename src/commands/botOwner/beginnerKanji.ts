import { infoEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';

declare module '@/types' {
  interface BotConfig {
    beginnerKanji: string[];
  }
}

const command: BotCommand = {
  name: 'beginnerKanji',
  aliases: ['kanji'],
  isAllowed: ['BOT_OWNER'],
  description: 'View or update beginner Kanji',
  options: [
    {
      name: 'add',
      short: 'a',
      description: 'Add kanji',
      bool: false,
    },
    {
      name: 'remove',
      short: 'r',
      description: 'Remove kanji',
      bool: false,
    },
  ],
  examples: ['kanji', 'kanji -a 僕私', 'kanji -r 鬱'],
  onBotInit: (bot) => {
    bot.config.beginnerKanji ||= [];
  },
  normalCommand: async ({ content, message, options, bot, server }) => {
    const add = (options['add'] as string) || '';
    const remove = (options['remove'] as string) || '';
    const currentKanji = bot.config.beginnerKanji;
    if (!add && !remove) {
      await message.channel.send(
        infoEmbed({
          title: 'Current Beginner Kanji',
          description: currentKanji.join(''),
        })
      );
    } else {
      if (add) {
        currentKanji.push(...add.split(''));
        bot.config.beginnerKanji = [...new Set(currentKanji)];
      }
      if (remove) {
        bot.config.beginnerKanji = currentKanji.filter(
          (k) => !remove.includes(k)
        );
      }
      await message.channel.send(successEmbed(`Beginner kanji list updated`));
    }
  },
};

export default command;
