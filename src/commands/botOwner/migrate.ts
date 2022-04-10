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
      description: 'Add config overrides',
      bool: false,
    },
    {
      name: 'remove',
      short: 'r',
      description: 'Remove config overrides',
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
        const adds = add.split(',');
        currentOverrides.push(...adds);
        adds.forEach((alias) => {
          const command = bot.commands[alias];
          if (!command) {
            message.channel.send(`${alias} is not a valid command`);
          } else {
            currentOverrides.push(command.name);
          }
        });

        bot.config.commandOverrides = [...new Set(currentOverrides)];
      }
      if (remove) {
        const removes = remove.split(',');
        const actualRemovals: string[] = [];
        removes.forEach((alias) => {
          const command = bot.commands[alias];
          if (!command) {
            message.channel.send(`${alias} is not a valid command`);
          } else {
            actualRemovals.push(command.name);
          }
        });
        bot.config.commandOverrides = currentOverrides.filter(
          (k) => !actualRemovals.includes(k)
        );
      }
      await message.channel.send(
        successEmbed(
          `${add ? `Added ${add}` : ''} ${remove ? `Removed: ${remove}` : ''}`
        )
      );
    }
  },
};

export default command;
