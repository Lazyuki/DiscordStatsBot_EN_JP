import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';
import db from '@db';

import { exec as execPromise, spawn, ChildProcess } from 'child_process';
import util from 'util';

const command: BotCommand = {
  name: 'kill',
  isAllowed: 'BOT_OWNER',
  description: 'Kill the bot',
  normalCommand: async ({ bot, message }) => {
    await message.channel.send('Good bye...');
    exitTask(bot, message);
    // process.exit(0);
    const exec = util.promisify(execPromise);
    exec(`npm run kill ciri`);
  },
};

export default command;
