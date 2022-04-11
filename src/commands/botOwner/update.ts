import { exec as execPromise } from 'child_process';
import util from 'util';

import { errorEmbed, infoEmbed } from '@utils/embed';
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
    try {
      const gitpull = await exec(gitpullCommand);
      if (gitpull.stdout) {
        stdoutMessage = await stdoutMessage.edit(
          appendCodeBlock(stdoutMessage.content, gitpull.stdout, 2000)
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
    } catch (e) {
      const err = e as Error;
      await message.channel.send(
        errorEmbed(
          `Error during \`${gitpullCommand}\`:\n${err.name}: ${err.message}`
        )
      );
      return;
    }
    // Pulled something, so restart the bot
    await bot.commands['restart'].normalCommand?.({
      bot,
      message,
      ...rest,
      options: { build: true },
    });
  },
};

export default command;
