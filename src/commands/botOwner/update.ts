import { exec as execPromise, spawn, ChildProcess } from 'child_process';
import util from 'util';

import {
  cleanEmbed,
  errorEmbed,
  infoEmbed,
  makeEmbed,
  successEmbed,
} from '@utils/embed';
import { BotCommand } from '@/types';
import { appendCodeBlock, codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'update',
  isAllowed: ['BOT_OWNER'],
  description: 'Pull from git and restart the bot',
  normalCommand: async ({ bot, message, ...rest }) => {
    const exec = util.promisify(execPromise);
    const gitpullCommand = `git pull`;
    let stdoutMessage = await message.channel.send(
      codeBlock('$ ' + gitpullCommand)
    );
    await message.channel.sendTyping();
    const gitpull = await exec(gitpullCommand);
    if (gitpull.stdout) {
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, gitpull.stdout, 4000)
      );
      if (gitpull.stdout === 'Already up to date.\n') {
        await message.channel.send(infoEmbed(`Nothing to update`));
        return; // Nothing to update
      }
    }
    if (gitpull.stderr && gitpull.stderr.toLowerCase().includes('error:')) {
      await message.channel.send(
        errorEmbed(
          `Error during \`${gitpullCommand}\`:\n${codeBlock(gitpull.stderr)}`
        )
      );
      return;
    }
    // Pulled something, so restart the bot
    const buildCommand = `npm run build`;
    stdoutMessage = await message.channel.send(codeBlock('$ ' + buildCommand));
    await message.channel.sendTyping();
    const build = await exec(buildCommand);
    if (build.stderr) {
      await message.channel.send(
        errorEmbed(
          `Error during \`${buildCommand}\`:\n${codeBlock(build.stderr)}`
        )
      );
      return;
    }
    const cleanStdout = build.stdout.replace(
      /tscpaths --project.+Replaced [0-9]+ paths in [0-9]+ files/,
      ''
    );
    stdoutMessage = await stdoutMessage.edit(
      appendCodeBlock(stdoutMessage.content, cleanStdout, 4000)
    );
    if (cleanStdout.includes('error')) {
      // TS error
      await message.channel.send(errorEmbed(`Build failed. Aborting...`));
      return;
    }
    await bot.commands['restart'].normalCommand?.({
      bot,
      message,
      ...rest,
    });
  },
};

export default command;
