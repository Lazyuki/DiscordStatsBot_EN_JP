import { BotCommand } from '@/types';

import { exec as execPromise } from 'child_process';
import util from 'util';
import { codeBlock } from '@utils/formatString';
import { infoEmbed, successEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'error',
  aliases: ['err'],
  isAllowed: ['BOT_OWNER'],
  options: [
    {
      name: 'tail',
      short: 'n',
      description: 'Number of lines to tail. Deafult: 30',
      bool: false,
    },
    {
      name: 'clear',
      short: 'c',
      description: 'Clear the error log',
      bool: true,
    },
  ],
  description: 'Tail latest errors',
  normalCommand: async ({ options, message, send }) => {
    const exec = util.promisify(execPromise);
    await message.channel.sendTyping();
    const clear = Boolean(options['tail']);
    if (clear) {
      await exec(`echo > errors.log`);
      await send(successEmbed('Cleared `errors.log`'));
      return;
    }
    const tail = parseInt((options['tail'] as string) || '50', 10);
    const { stdout } = await exec(`tail -n ${tail} errors.log`);
    if (stdout) {
      await send(codeBlock(stdout, 'accesslog'));
    } else {
      await send(infoEmbed(`No errors`));
    }
  },
};

export default command;
