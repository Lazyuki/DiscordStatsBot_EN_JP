import { infoEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';

declare module '@/types' {
  interface BotConfig {
    commandOverrides: string[];
  }
}

const command: BotCommand = {
  name: 'migrate',
  isAllowed: ['BOT_OWNER'],
  description: 'Ciri migration config',
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
  examples: ['migrate', 'migrate -a user', 'migrate -r user'],
  onBotInit: (bot) => {
    bot.config.commandOverrides ||= [];
  },
  normalCommand: async ({ content, message, options, bot, server }) => {
    const add = (options['add'] as string) || '';
    const remove = (options['remove'] as string) || '';
    const currentOverrides = bot.config.commandOverrides;
    if (!add && !remove) {
      await message.channel.send(
        infoEmbed({
          title: 'Current Overrides',
          description: currentOverrides.join(', '),
        })
      );
    } else {
      if (add) {
        currentOverrides.push(...add.split(','));
        bot.config.commandOverrides = [...new Set(currentOverrides)];
      }
      if (remove) {
        bot.config.commandOverrides = currentOverrides.filter(
          (k) => !remove.includes(k)
        );
      }
      await message.channel.send(successEmbed(`Command list updated`));
    }
  },
};

export default command;
