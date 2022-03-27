import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';

const command: BotCommand = {
  name: 'restart',
  isAllowed: ['BOT_OWNER'],
  description: 'Restart the bot',
  normalCommand: async ({ bot, message }) => {
    await message.channel.send('Restarting...');
    exitTask(bot, message);
    process.exit(2);
  },
};

export default command;
