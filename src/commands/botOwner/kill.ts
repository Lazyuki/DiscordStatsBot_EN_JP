import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';

import { exec as execPromise } from 'child_process';
import util from 'util';
import { cleanEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'kill',
  isAllowed: ['BOT_OWNER'],
  description: 'Kill the bot',
  normalCommand: async ({ bot, message }) => {
    await message.channel.send(cleanEmbed('Shutting down...'));
    exitTask(bot, message);
    const exec = util.promisify(execPromise);
    exec(`npm run kill ciri`);
  },
};

export default command;
