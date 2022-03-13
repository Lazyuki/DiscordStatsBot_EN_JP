import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';
import db from '@database';

const command: BotCommand = {
  name: 'kill',
  isAllowed: 'BOT_OWNER',
  description: 'Kill the bot',
  normalCommand: async ({ bot, message }) => {
    await message.channel.send('Good bye...');
    exitTask(bot, message);
    process.exit(0);
  },
};

export default command;
