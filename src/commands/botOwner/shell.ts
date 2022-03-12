import { exec as execPromise, spawn, ChildProcess } from 'child_process';
import util from 'util';

import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { CommandArgumentError } from '@/errors';
import { codeBlock } from '@utils/formatString';

let openShell: ChildProcess | null = null;

const command: BotCommand = {
  name: 'shell',
  isAllowed: 'BOT_OWNER',
  description: 'Run shell commands',
  options: ['-i (interactive shell)'],
  examples: ['shell tail -n 100 error.log', 'shell -i'],
  normalCommand: async ({ commandContent, message, send }) => {
    if (!commandContent) {
      throw new CommandArgumentError('Enter a command');
    }
    if (commandContent === 'end' && openShell) {
      openShell.kill();
      openShell = null;
      return;
    } else if (commandContent === '-i') {
      try {
        const shell = spawn('zsh', ['-i']);
        shell.stdout.setEncoding('utf8');
        shell.on('close', (code) => {
          send(`shell terminated : ${code}`);
        });
        openShell = shell;
      } catch (e) {
        await send((e as Error).message);
      }
    } else if (openShell) {
      openShell.stdin?.write(commandContent);
    } else {
      const exec = util.promisify(execPromise);
      await message.channel.sendTyping();
      const { stdout, stderr } = await exec(`cd ~/Ciri && ${commandContent}`);
      if (stdout) {
        await send(codeBlock(stdout));
      }
      if (stderr) {
        await send(errorEmbed(`StdErr:\n${codeBlock(stderr)}`));
      }
      if (!stdout && !stderr) {
        await send(successEmbed('*No output*'));
      }
    }
  },
};

export default command;
