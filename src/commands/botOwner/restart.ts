import { exec as execPromise } from 'child_process';
import util from 'util';
import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';
import { cleanEmbed, errorEmbed } from '@utils/embed';
import { appendCodeBlock, codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'restart',
  aliases: ['rs'],
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
      const interval = setInterval(() => message.channel.sendTyping(), 9_000); // Build takes long, make sure the typing indicator lasts until the end

      const build = await exec(buildCommand);
      if (build.stderr) {
        clearInterval(interval);
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
        .join('\n')
        .replace(/\/home\/[^/]+\/Ciri/g, '/home/Ciri'); // remove name
      stdoutMessage = await stdoutMessage.edit(
        appendCodeBlock(stdoutMessage.content, cleanStdout, 2000)
      );
      if (cleanStdout.includes('error TS')) {
        // TS error
        clearInterval(interval);
        await message.channel.send(errorEmbed(`Build failed. Aborting...`));
        return;
      }
      clearInterval(interval);
    }
    await message.channel.send(cleanEmbed('Restarting...'));
    exitTask(bot, message);
    process.exit(2);
  },
};

export default command;
