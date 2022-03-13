import env from 'env-var';

import { BotCommand } from '@/types';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';

export const DEFAULT_PREFIX = env.get('DEFAULT_PREFIX').required().asString();
export const VALID_PREFIX = /^\S{1,10}$/;

const command: BotCommand = {
  name: 'prefix',
  isAllowed: 'ADMIN',
  description:
    'Change the command prefix. Leave blank to restore the default prefix',
  examples: ['prefix c!', 'prefix'],
  normalCommand: async ({ commandContent, server, send }) => {
    const currentPrefix = server.config.prefix;
    if (!commandContent) {
      if (currentPrefix === DEFAULT_PREFIX) {
        await send(
          makeEmbed({
            description: `The command prefix in this server is ${DEFAULT_PREFIX}`,
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
      if (VALID_PREFIX.test(commandContent)) {
        server.config.prefix = commandContent;
        await send(
          successEmbed(
            `The command prefix has been set to \`${commandContent}\` from \`${currentPrefix}\``
          )
        );
      } else {
        await send(
          errorEmbed(
            'The command prefix must not contain any spaces and cannot be longer than 10 characters'
          )
        );
      }
    }
  },
};

export default command;
