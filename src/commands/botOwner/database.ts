import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { parseSubCommand } from '@utils/argumentParsers';
import { fetchAnyQuery, runAnyQuery } from '@database/statements';
import { codeBlock } from '@utils/formatString';

const command: BotCommand = {
  name: 'database',
  aliases: ['db'],
  isAllowed: ['BOT_OWNER'],
  description: 'Run database queries',
  examples: ['db run INSERT INTO ...', 'db fetch SELECT * FROM messages ...'],
  normalCommand: async ({ content, message, bot, server, reply, send }) => {
    const { subCommand, restContent } = parseSubCommand(content, [
      'run',
      'fetch',
    ]);
    if (subCommand === 'run') {
      try {
        runAnyQuery(restContent);
        await message.channel.send(successEmbed('Success'));
      } catch (e) {
        const err = e as Error;
        await message.channel.send(errorEmbed(`${err.name}: ${err.message}`));
      }
    } else if (subCommand === 'fetch') {
      try {
        const res = fetchAnyQuery(restContent);
        if (res?.length) {
          await message.channel.send(
            successEmbed(
              `${res.length} rows\n${codeBlock(
                res
                  .slice(0, 10)
                  .map((row) => JSON.stringify(row))
                  .join('\n')
              )}`
            )
          );
        } else {
          await message.channel.send(successEmbed('No rows'));
        }
      } catch (e) {
        const err = e as Error;
        await message.channel.send(errorEmbed(`${err.name}: ${err.message}`));
      }
    }
  },
};

export default command;
