import { exec as execPromise } from 'child_process';
import util from 'util';
import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';
import { cleanEmbed, errorEmbed } from '@utils/embed';
import { appendCodeBlock } from '@utils/formatString';
import { codeBlock } from 'common-tags';

const command: BotCommand = {
  name: 'restart',
  isAllowed: ['BOT_OWNER'],
  description: 'Restart the bot',
  options: [
    {
      name: 'build',
      short: 'b',
      description: 'Run `npm run build` first and then restart',
      bool: true,
    },
  ],
  normalCommand: async ({ bot, message, options }) => {
    if (options['build']) {
      const exec = util.promisify(execPromise);
      const buildCommand = `npm run build`;
      let stdoutMessage = await message.channel.send(
        codeBlock('$ ' + buildCommand)
      );
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
      const cleanStdout = build.stdout
        .split('\n')
        .filter((line) => !line.endsWith('paths'))
        .join('\n');
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, cleanStdout, 2000)
      );
      if (cleanStdout.includes('error TS')) {
        // TS error
        await message.channel.send(errorEmbed(`Build failed. Aborting...`));
        return;
      }
    }
    await message.channel.send(cleanEmbed('Restarting...'));
    exitTask(bot, message);
    process.exit(2);
  },
};

export default command;
