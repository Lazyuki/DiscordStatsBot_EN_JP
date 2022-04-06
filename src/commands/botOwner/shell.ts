import { exec as execPromise, spawn, ChildProcess } from 'child_process';
import util from 'util';

import { cleanEmbed, errorEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { CommandArgumentError } from '@/errors';
import { codeBlock } from '@utils/formatString';

let openShell: ChildProcess | null = null;

const command: BotCommand = {
  name: 'shell',
  isAllowed: ['BOT_OWNER'],
  description: 'Run shell commands',
  options: [
    {
      name: 'interactive',
      short: 'i',
      bool: true,
      description: 'Start an interactive shell',
    },
  ],
  examples: ['shell tail -n 100 error.log', 'shell -i', 'shell end'],
  normalCommand: async ({ content, message, send, options }) => {
    if (!content) {
      throw new CommandArgumentError('Enter a command');
    }
    if (content === 'end' && openShell) {
      openShell.kill();
      openShell = null;
      await send(successEmbed('Interactive shell terminated'));
      return;
    } else if (options['interactive']) {
      try {
        const shell = spawn('zsh', ['-i']);
        shell.stdout.setEncoding('utf8');
        shell.stdout.on('data', function (data) {
          const str = data.toString();
          send(codeBlock(str));
        });
        shell.stderr.setEncoding('utf8');
        shell.stderr.on('data', function (data) {
          const str = data.toString();
          send(codeBlock(str));
        });
        shell.on('close', (code) => {
          send(cleanEmbed(`shell terminated : ${code}`));
        });
        openShell = shell;
        await send(successEmbed('Interactive shell created'));
      } catch (e) {
        await send((e as Error).message);
      }
    } else if (openShell) {
      openShell.stdin?.write(content, (err) => {
        if (err) {
          send(errorEmbed(`${err.name}: ${err.message}`));
        }
      });
    } else {
      const exec = util.promisify(execPromise);
      await message.channel.sendTyping();
      const { stdout, stderr } = await exec(content);
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
