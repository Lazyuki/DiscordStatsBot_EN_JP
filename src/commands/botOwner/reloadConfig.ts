import { BotCommand } from '@/types';
import { successEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'reloadConfig',
  isAllowed: ['BOT_OWNER'],
  options: [
    {
      name: 'all',
      short: 'a',
      description: "Reload all servers' config",
      bool: true,
    },
  ],
  description: 'Reload server config from the saved file',
  normalCommand: async ({ bot, message, options, server }) => {
    if (options['all']) {
      for (const s of Object.values(bot.servers)) {
        s.reloadConfig(bot);
      }
    } else {
      server.reloadConfig(bot);
    }
    await message.channel.send(successEmbed(`Reloaded server config`));
  },
};

export default command;
