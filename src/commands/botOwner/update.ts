import { exec as execPromise, spawn, ChildProcess } from 'child_process';
import util from 'util';

import { cleanEmbed, errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { appendCodeBlock, codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'update',
  isAllowed: ['BOT_OWNER'],
  description: 'Pull from git and restart the bot',
  normalCommand: async ({ bot, message, ...rest }) => {
    const exec = util.promisify(execPromise);
    // const dir = env.get('PROJECT_DIR').asString();
    // if (!dir) {
    //   await message.channel.send(
    //     errorEmbed('`PROJECT_DIR` is not set in `.env`. Aborting...')
    //   );
    //   return;
    // }
    const gitpullCommand = `git pull`;
    let stdoutMessage = await message.channel.send(
      codeBlock('$ ' + gitpullCommand)
    );
    await message.channel.sendTyping();
    const gitpull = await exec(gitpullCommand);
    if (gitpull.stdout) {
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, gitpull.stdout)
      );
      if (gitpull.stdout === 'Already up to date.\n') {
        return; // Nothing to update
      }
    }
    if (gitpull.stderr) {
      await message.channel.send(
        errorEmbed(
          `Error during \`${gitpullCommand}\`:\n${codeBlock(gitpull.stderr)}`
        )
      );
      return;
    }
    if (gitpull.stdout) {
      // Pulled something, so restart the bot
      const buildCommand = `npm run build`;
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, '$ ' + buildCommand)
      );
      const build = await exec(buildCommand);
      if (build.stderr) {
        await message.channel.send(
          errorEmbed(
            `Error during \`${buildCommand}\`:\n${codeBlock(build.stderr)}`
          )
        );
        return;
      }
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, build.stdout)
      );
      if (build.stdout.includes('error')) {
        // TS error
        await message.channel.send(errorEmbed(`Build failed. Aborting...`));
        return;
      }
      await bot.commands['restart'].normalCommand?.({
        bot,
        message,
        ...rest,
      });
    }
  },
};

export default command;