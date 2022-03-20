import { BotCommand } from '@/types';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { DEFAULT_PREFIX } from '@/envs';

export const VALID_PREFIX = /^\S{1,5}$/;

const command: BotCommand = {
  name: 'prefix',
  isAllowed: 'ADMIN',
  description:
    'Change the command prefix. Leave blank to restore the default prefix',
  examples: ['prefix c!', 'prefix'],
  normalCommand: async ({ content, server, send }) => {
    const currentPrefix = server.config.prefix;
    if (!content) {
      if (currentPrefix === DEFAULT_PREFIX) {
        await send(
          makeEmbed({
            description: `The command prefix in this server is using the default prefix, \`${DEFAULT_PREFIX}\``,
          })
        );
      } else {
        server.config.prefix = DEFAULT_PREFIX;
        await send(
          successEmbed(
            `The command prefix has been reset to \`${DEFAULT_PREFIX}\` from \`${currentPrefix}\` `
          )
        );
      }
    } else {
      if (VALID_PREFIX.test(content)) {
        server.config.prefix = content;
        await send(
          successEmbed(
            `The command prefix has been set to \`${content}\` from \`${currentPrefix}\``
          )
        );
      } else {
        await send(
          errorEmbed(
            'The command prefix must not contain any spaces and cannot be longer than 5 characters'
          )
        );
      }
    }
  },
};

export default command;
